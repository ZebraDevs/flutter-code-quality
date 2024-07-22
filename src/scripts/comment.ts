import { endGroup, startGroup } from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { stepResponse } from "../main";
import { debug } from "@actions/core";

const SIGNATURE = `<sub>Created with <a href='https://github.com/ZebraDevs/flutter-code-quality'>Flutter code quality action</a></sub>`;

export const createComment = (
  analyze: stepResponse | undefined,
  test: stepResponse | undefined,
  coverage: stepResponse | undefined,
  behindBy: stepResponse | undefined
): string => {
  startGroup("Building comment");
  const isSuccess = !analyze?.error && !test?.error && !coverage?.error && !behindBy?.error;
  debug("isSuccess: " + isSuccess.toString());
  let output = `<h2>PR Checks complete</h2>
<ul>
  <li>✅ - Linting / Formatting</li>
 ${analyze ? `<li>${analyze?.output.replaceAll("`|\"|'|<|>", "")}</li>` : ""}
  ${test ? `<li>${test?.output.replaceAll("`|\"|'|<|>", "")}</li>` : ""}
  ${behindBy && isSuccess ? "<li>✅ - Branch is not behind</li>" : ""}
  ${coverage ? `<li>${coverage?.output.replaceAll("`|\"|'|<|>", "")}</li>` : ""}
</ul>

${SIGNATURE}
    `.replaceAll("\r\n|\n|\r", "");
  debug("Comment built");
  endGroup();
  return output;
};

export async function postComment(octokit: InstanceType<typeof GitHub>, commentMessage: string, context: Context) {
  startGroup(`Commenting on PR`);

  const pr = {
    repo: context.repo.repo,
    owner: context.repo.owner,
    issue_number: context.issue.number,
  };

  let commentId;
  try {
    debug("Getting existing comments");
    const comments = (await octokit.rest.issues.listComments(pr)).data;

    for (let i = comments.length; i--; ) {
      const c = comments[i];
      if (c.body?.includes(SIGNATURE)) {
        commentId = c.id;
        debug("Existing comment found");

        break;
      }
    }
  } catch (e) {
    console.error("Could not find existing comment", e);
  }

  if (commentId) {
    debug("Updating existing comment");
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
    debug("Posting new comment");
    try {
      await octokit.rest.issues.createComment({ ...pr, body: commentMessage });
    } catch (e) {
      console.error("Error posting comment", e);
    }
  }
  endGroup();
}
