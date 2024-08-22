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
import minimist from "minimist";

export type stepResponse = { output: string; error: boolean };
export const COVERAGE_DIR = ".coverage";

const run = async (isLocal: boolean) => {
  try {
    const workingDirectory = getInput("working-directory");
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

    await push(COVERAGE_DIR);

    if (analyzeStr?.error || testStr?.error || coverageStr?.error) {
      setFailed(`${analyzeStr?.output}\n${testStr?.output}\n${coverageStr?.output}`);
    }
  } catch (err) {
    setFailed(`Action failed with error ${err}`);
  }
};

const argv = minimist(process.argv.slice(2));

run(argv.local ?? false);

//TODO: Show coverage diff in comment - which files coverage have changed.
