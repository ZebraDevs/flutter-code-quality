import { getInput } from "@actions/core";
import { getAnalyze } from "./scripts/analyze";
import { getOctokit, context } from "@actions/github";
import { getCoverage, getOldCoverage } from "./scripts/coverage";
import { getTest } from "./scripts/runTests";
import { createComment, postComment } from "./scripts/comment";
import { setup } from "./scripts/setup";
import { checkBranchStatus } from "./scripts/behind";
import { push } from "./scripts/push";

export type stepResponse = { output: string; error: boolean };

const run = async () => {
  const token = process.env.GITHUB_TOKEN || getInput("token");
  const octokit = getOctokit(token);
  const behindByStr = await checkBranchStatus(octokit, context);
  await setup();
  const oldCoverage: number | undefined = getOldCoverage();
  const analyzeStr: stepResponse = await getAnalyze();
  const testStr: stepResponse = await getTest();
  const coverageStr: stepResponse = await getCoverage(oldCoverage);
  const comment = createComment(analyzeStr, testStr, coverageStr, behindByStr);
  postComment(octokit, comment, context);
  await push();
};

run();
