import { getBooleanInput, getInput, setFailed } from "@actions/core";
import { getAnalyze } from "./scripts/analyze";
import { getOctokit, context } from "@actions/github";
import { getCoverage } from "./scripts/coverage";
import { getTest } from "./scripts/runTests";
import { createComment as getComment, postComment } from "./scripts/comment";
import { setup } from "./scripts/setup";
import { checkBranchStatus } from "./scripts/behind";
import { pushChanges } from "./scripts/push";
import { retrievePreviousCoverage } from "./scripts/prevCoverage";
import { Lcov } from "lcov-utils";
import minimist from "minimist";
import { execSync } from "node:child_process";

export type stepResponse = { output: string; error: boolean };
export const COVERAGE_DIR = ".coverage";

const run = async (isLocal: boolean) => {
  try {
    execSync("flutter pub get");
  } catch (e) {
    console.error(e);
  }

  try {
    const workingDirectory = isLocal ? "." : getInput("working-directory");
    // Check if the working directory is different from the current directory
    if (workingDirectory && workingDirectory !== process.cwd()) {
      process.chdir(workingDirectory);
    }

    const token = process.env.GITHUB_TOKEN || getInput("token");

    const runTests = isLocal ? true : getBooleanInput("run-tests");
    const runAnalyze = isLocal ? true : getBooleanInput("run-analyze");
    const runCoverage = isLocal ? true : getBooleanInput("run-coverage");
    const runPrevCoverage = isLocal ? true : getBooleanInput("run-prev-coverage");
    const runBehindBy = isLocal ? true : getBooleanInput("run-behind-by");
    const createComment = isLocal ? true : getBooleanInput("create-comment");
    const score = isLocal ? "90" : getInput("coverage-pass-score");

    const octokit = getOctokit(token);
    let prevCoverage: Lcov | undefined;
    if (runPrevCoverage) {
      try {
        prevCoverage = await retrievePreviousCoverage(octokit, context, COVERAGE_DIR);
      } catch (e) {
        console.error(e);
      }
    }

    const behindByStr: stepResponse | undefined = runBehindBy ? await checkBranchStatus(octokit, context) : undefined;
    await setup();

    const analyzeStr: stepResponse | undefined = runAnalyze ? await getAnalyze() : undefined;
    const testStr: stepResponse | undefined = runTests ? await getTest(COVERAGE_DIR) : undefined;
    const coverageStr: stepResponse | undefined = runCoverage
      ? getCoverage(prevCoverage, COVERAGE_DIR, score)
      : undefined;

    const comment: string | undefined = createComment
      ? getComment(analyzeStr, testStr, coverageStr, behindByStr)
      : undefined;

    if (createComment) postComment(octokit, comment!, context);

    await pushChanges(COVERAGE_DIR);

    const errors = [analyzeStr, testStr, coverageStr].filter((step) => step?.error);
    if (errors.length > 0) {
      setFailed(errors.map((step) => step?.output).join("; "));
    }
  } catch (err) {
    setFailed(`Action failed with error ${err}`);
  }
};

const argv = minimist(process.argv.slice(2));

run(argv.local ?? false);

//TODO: Show coverage diff in comment - which files coverage have changed.
