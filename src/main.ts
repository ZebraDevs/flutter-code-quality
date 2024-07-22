import { getBooleanInput, getInput, setFailed } from "@actions/core";
import { getAnalyze } from "./scripts/analyze";
import { getOctokit, context } from "@actions/github";
import { getCoverage } from "./scripts/coverage";
import { getTest } from "./scripts/runTests";
import { createComment as getComment, postComment } from "./scripts/comment";
import { setup } from "./scripts/setup";
import { checkBranchStatus } from "./scripts/behind";
import { push } from "./scripts/push";
import { retrievePreviousCoverage } from "./scripts/prevCoverage";
import { Lcov } from "lcov-utils";

export type stepResponse = { output: string; error: boolean };
export const COVERAGE_DIR = ".coverage";

const run = async () => {
  try {
    const workingDirectory = getInput("working-directory");
    // Check if the working directory is different from the current directory
    if (workingDirectory && workingDirectory !== process.cwd()) {
      process.chdir(workingDirectory);
    }

    const token = process.env.GITHUB_TOKEN || getInput("token");

    const runTests = getBooleanInput("run-tests");
    const runAnalyze = getBooleanInput("run-analyze");
    const runCoverage = getBooleanInput("run-coverage");
    const runPrevCoverage = getBooleanInput("run-prev-coverage");
    const runBehindBy = getBooleanInput("run-behind-by");
    const createComment = getBooleanInput("create-comment");

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
    const coverageStr: stepResponse | undefined = runCoverage ? getCoverage(prevCoverage, COVERAGE_DIR) : undefined;

    const comment: string | undefined = createComment
      ? getComment(analyzeStr, testStr, coverageStr, behindByStr)
      : undefined;

    if (createComment) postComment(octokit, comment!, context);

    await push();

    if (analyzeStr?.error || testStr?.error || coverageStr?.error) {
      setFailed(`${analyzeStr?.output}\n${testStr?.output}\n${coverageStr?.output}`);
    }
  } catch (err) {
    setFailed(`Action failed with error ${err}`);
  }
};

run();

//TODO: Show coverage diff in comment - which files coverage have changed.
