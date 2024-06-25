import { endGroup, startGroup } from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { stepResponse } from "./types";

const SIGNATURE = `<sub>Created with <a href='https://github.com/ZebraDevs/flutter-code-quality'>Flutter code quality action</a></sub>`;

export const createComment = (
  analyze: stepResponse,
  test: stepResponse,
  coverage: stepResponse,
  behindBy: stepResponse
): string => {
  const isSuccess =
    !analyze.error && !test.error && !coverage.error && !behindBy.error;

  let output = `<h2>PR Checks complete</h2>
<ul>
  <li>✅ - Linting / Formatting</li>
  <li>${analyze.output.replaceAll("`|\"|'|<|>", "")}</li>
  <li>${test.output.replaceAll("`|\"|'|<|>", "")}</li>
  ${isSuccess ? "<li>✅ - Branch is not behind" : null}
  <li>${coverage.output.replaceAll("`|\"|'|<|>", "")}</li>
</ul>

${SIGNATURE}
    `.replaceAll("\r\n|\n|\r", "");

  return output;
};

export async function postComment(
  octokit: InstanceType<typeof GitHub>,
  commentMessage: string,
  context: Context
) {
  startGroup(`Commenting on PR`);

  const pr = {
    repo: context.repo.repo,
    owner: context.repo.owner,
    issue_number: context.issue.number,
  };

  let commentId;
  try {
    const comments = (await octokit.rest.issues.listComments(pr)).data;

    for (let i = comments.length; i--; ) {
      const c = comments[i];
      if (c.body?.includes(SIGNATURE)) {
        commentId = c.id;
        break;
      }
    }
  } catch (e) {
    console.error("Could not find existing comment", e);
  }

  if (commentId) {
    try {
      await octokit.rest.issues.updateComment({
        ...pr,
        comment_id: commentId,
        body: commentMessage,
      });
    } catch (e) {
      commentId = null;
    }
  }

  if (!commentId) {
    try {
      await octokit.rest.issues.createComment({ ...pr, body: commentMessage });
    } catch (e) {
      console.error("Error creating comment", e);
    }
  }
  endGroup();
}
