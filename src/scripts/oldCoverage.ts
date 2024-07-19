import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { exec } from "@actions/exec";
import { Lcov, parse } from "lcov-utils";
import { COV_FILE, importLcov } from "./utils";
import { DefaultArtifactClient } from "@actions/artifact";
import { endGroup, info, startGroup } from "@actions/core";
import { existsSync, mkdirSync } from "fs";
import AdmZip from "adm-zip";

const ARTIFACT_NAME = "coverage";

export const retrievePreviousCoverage = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  coverageDirectory: string
): Promise<Lcov> => {
  startGroup("Retrieving previous coverage");
  let report: Lcov | undefined;
  let baseSHA: string, headSHA: string;
  try {
    const pullDetails = await octokit.request(
      `GET /repos/${context.issue.owner}/${context.issue.repo}/pulls/${context.issue.number}`
    );

    baseSHA = pullDetails.data.base.sha;
    headSHA = pullDetails.data.head.sha;
  } catch (err) {
    console.error("Failed to get pull details", err);
    throw err;
  }
  try {
    const response: { total_count: number; artifacts: {}[] } = (
      await octokit.request(`GET /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts`)
    ).data;

    console.log(response.total_count + " artifacts found");

    const allArtifacts = response.artifacts.filter((artifact: any) => artifact.name.includes(ARTIFACT_NAME));
    const artifactIndex: number = allArtifacts.findIndex((artifact: any) => artifact.name.includes(baseSHA));
    let artifact: any | undefined;
    if (artifactIndex != -1) {
      artifact = allArtifacts.splice(artifactIndex, 1)[0];
    }
    if (artifact) {
      console.log("Artifact found: " + artifact);
      const zipData: ArrayBuffer = (
        await octokit.request(
          `GET /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts/${artifact.id}/zip`
        )
      ).data;
      console.log("Pulled artifact");
      const zip = new AdmZip(toBuffer(zipData));
      console.log("Extracted artifact");
      const rawLcov = zip.readAsText("coverage/lcov.info");
      console.log("Parsed lcov: " + rawLcov);
      report = parse(rawLcov);
    } else {
    }

    if (allArtifacts.length > 0) {
      startGroup("Deleting old artifacts");
      allArtifacts.forEach(async (artifact: any) => {
        info(`Deleting artifact: ${artifact["id"]}`);
        await octokit.request(
          `DELETE /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts/${artifact["id"]}`
        );
      });
      endGroup();
    }
  } catch (e) {
    console.error("Failed checking status.", e);
  }
  if (!report) {
    console.log("Artifact not found, will pull coverage from BASE");
    report = await generateOldCoverage(baseSHA, headSHA, coverageDirectory);
  }
  endGroup();
  if (report) return report;

  throw new Error("Failed to generate coverage report");
};

const generateOldCoverage = async (
  prev_sha: string,
  current_sha: string,
  coverage_directory: string
): Promise<Lcov> => {
  const artifact = new DefaultArtifactClient();
  await exec(`git checkout ${prev_sha}`);
  await exec("flutter test --coverage");
  const report = await importLcov(coverage_directory);
  const { id, size } = await artifact.uploadArtifact(
    ARTIFACT_NAME + "-" + prev_sha,
    [`${coverage_directory}/${COV_FILE}`],
    ".",
    {}
  );

  console.log(`Artifact uploaded with id: ${id} and size: ${size}`);

  await exec(`git reset --hard`);
  await exec(`git checkout ${current_sha}`);
  return report;
};

export const toBuffer = (arrayBuffer: ArrayBuffer) => {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
};
