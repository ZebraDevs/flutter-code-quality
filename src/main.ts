import { getInput } from "@actions/core";
import { getAnalyze } from "./analyze";
import { getCoverage, getOldCoverage } from "./coverage";
import { getTest } from "./test";
import { getOctokit, context } from "@actions/github";
import { createComment, postComment } from "./comment";
import { setup } from "./setup";
import { checkBranchStatus } from "./behind";
import { stepResponse } from "./types";

const run = async () => {
  // const comment = `Test comment, ${Date.now().toLocaleString("en_GB")}
  // <sub>Created with <a href='https://github.com/ZebraDevs/flutter-code-quality'>Flutter code quality action</a></sub>
  //     }`;

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
};

run();
