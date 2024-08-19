import { endGroup, setFailed, setOutput, startGroup } from "@actions/core";
import { exec } from "@actions/exec";
import { execSync } from "child_process";
import { debug } from "@actions/core";

/**
 * Push changes to the branch
 */
export const push = async () => {
  startGroup("Check for changes");
  let stdout: string = "";
  try {
    await exec("git status --porcelain", [], {
      listeners: { stdout: (data) => (stdout += data.toString()) },
    });
  } catch (e) {
    console.error("Unable to check if there are changes", e);
  }
  endGroup();

  /// If `stdout` is empty, there are no changes
  if (stdout != "") {
    try {
      startGroup("Push changes");
      await exec('git config --global user.name "github-actions"');
      await exec('git config --global user.email "github-actions@github.com"');
      await exec("git add -A");
      execSync(`git commit -m 'chore(automated): Lint commit and format' `);
      await exec("git push -f");
      debug("Changes pushed onto branch");
    } catch (e) {
      console.error("Unable to push changes", e);
      setFailed("Unable to push changes to branch");
    } finally {
      endGroup();
    }
  }
};
