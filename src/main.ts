import { getInput } from "@actions/core";
import { getAnalyze } from "./analyze";
import { getCoverage, getOldCoverage } from "./coverage";
import { getTest } from "./test";
import { getOctokit, context } from "@actions/github";
import { createComment, postComment } from "./comment";
import { setup } from "./setup";
import { checkBranchStatus } from "./behind";
import { push } from "./push";

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
