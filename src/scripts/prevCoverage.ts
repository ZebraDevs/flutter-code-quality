import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { exec } from "@actions/exec";
import { Lcov, parse } from "lcov-utils";
import { COV_FILE, importLcov, toBuffer } from "./utils";
import { DefaultArtifactClient } from "@actions/artifact";
import { endGroup, startGroup } from "@actions/core";
import { debug } from "@actions/core";
import AdmZip from "adm-zip";

const ARTIFACT_NAME = "coverage";

/**
 * Retrieve previous coverage report from the base branch
 * @param octokit - Instance of GitHub client
 * @param context - GitHub context
 * @param coverageDirectory - Directory to store coverage report
 * @returns Lcov object
 */
export const retrievePreviousCoverage = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  coverageDirectory: string
): Promise<Lcov> => {
  startGroup("Retrieving previous coverage");
  let report: Lcov | undefined;
  let baseSHA: string, headBranch: string;
  try {
    const pullDetails = await octokit.request(
      `GET /repos/${context.issue.owner}/${context.issue.repo}/pulls/${context.issue.number}`
    );

    baseSHA = pullDetails.data.base.sha;
    headBranch = pullDetails.data.head.ref;
  } catch (err) {
    console.error("Failed to get pull details", err);
    throw err;
  }
  try {
    const response: { total_count: number; artifacts: {}[] } = (
      await octokit.request(`GET /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts`)
    ).data;

    debug(response.total_count + " artifacts found");

    const allArtifacts = response.artifacts.filter((artifact: any) => artifact.name.includes(ARTIFACT_NAME));
    const artifactIndex: number = allArtifacts.findIndex((artifact: any) => artifact.name.includes(baseSHA));
    let artifact: any | undefined;
    if (artifactIndex != -1) {
      artifact = allArtifacts.splice(artifactIndex, 1)[0];
    }
    if (artifact) {
      debug("Previous coverage report found");
      const zipData: ArrayBuffer = (
        await octokit.request(
          `GET /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts/${artifact.id}/zip`
        )
      ).data;
      debug("Pulled previous coverage report");
      const zip = new AdmZip(toBuffer(zipData));
      debug("Extracted artifact");
      const rawLcov = zip.readAsText(`${coverageDirectory}/${COV_FILE}`);
      debug("Parsed lcov");
      report = parse(rawLcov);
    } else {
    }

    if (allArtifacts.length > 0) {
      debug("Deleting old artifacts");
      allArtifacts.forEach(async (artifact: any) => {
        debug(`Deleting artifact: ${artifact["id"]}`);
        await octokit.request(
          `DELETE /repos/${context.issue.owner}/${context.issue.repo}/actions/artifacts/${artifact["id"]}`
        );
      });
    }
  } catch (e) {
    console.error("Failed checking status.", e);
  }
  if (!report) {
    debug("Artifact not found, will pull coverage from BASE");
    report = await generatePreviousCoverage(baseSHA, headBranch, coverageDirectory);
  } else {
    try {
      await exec(`rm ${coverageDirectory}/${COV_FILE}`);
    } catch (e) {
      debug("Failed to delete old coverage file");
    }
  }
  endGroup();
  if (report) return report;

  throw new Error("Failed to generate coverage report");
};

/**
 * Generate coverage report from the base branch
 * @param prev_sha - Base branch SHA
 * @param current_branch - Current branch name
 * @param coverage_directory - Directory to store coverage report
 * @returns Previous coverage report as Lcov object
 */
const generatePreviousCoverage = async (
  prev_sha: string,
  current_branch: string,
  coverage_directory: string
): Promise<Lcov> => {
  const artifact = new DefaultArtifactClient();
  await exec(`git checkout ${prev_sha}`);
  await exec(`flutter test --coverage --coverage-path ${coverage_directory}/lcov.info`);
  const report = await importLcov(coverage_directory);
  const { id, size } = await artifact.uploadArtifact(
    ARTIFACT_NAME + "-" + prev_sha,
    [`${coverage_directory}/${COV_FILE}`],
    ".",
    {}
  );

  debug(`Artifact uploaded with id: ${id} and size: ${size}`);
  await exec(`git reset --hard`);
  await exec(`git checkout ${current_branch}`);
  return report;
};
