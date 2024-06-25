import { endGroup, startGroup } from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { stepResponse } from "./types";

export const checkBranchStatus = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context
): Promise<stepResponse> => {
  startGroup("Check if branch is behind");
  let behindByStr: stepResponse | undefined;
  try {
    const pr_details = await octokit.request(
      `GET /repos/${context.issue.owner}/${context.issue.repo}/pulls/${context.issue.number}`
    );
    console.log("Got PR details", pr_details);
    const branch_details = await octokit.request(
      `GET /repos/${context.issue.owner}/${context.issue.repo}/compare/${pr_details.data.base.sha}...${pr_details.data.head.sha}`
    );
    console.log("Got branch details", branch_details);
    const behind_by = branch_details.data.behind_by;
    if (behind_by == 0 || behind_by == "0") {
      behindByStr = {
        output: "✅ - Branch is not behind and can be merged",
        error: false,
      };
    } else if (behind_by > 0) {
      behindByStr = {
        output: `⚠️ - Branch is behind by ${behind_by} commits`,
        error: true,
      };
    }
  } catch (e) {
    console.error("Failed checking status.", e);
  }
  if (behindByStr == undefined) {
    behindByStr = { output: "", error: true };
  }
  endGroup();
  return behindByStr;
};
