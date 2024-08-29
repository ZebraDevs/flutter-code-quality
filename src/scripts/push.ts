import { endGroup, setFailed, setOutput, startGroup } from "@actions/core";
import { exec } from "@actions/exec";
import { execSync } from "child_process";
import { debug } from "@actions/core";
import { start } from "repl";

/**
 * Push changes to the branch
 */
export const pushChanges = async (coverageDirectory: string) => {
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
  startGroup("Parse changes and remove coverage directory");
  const changes = stdout.split("\n").filter((line) => line.trim() !== "");
  if (changes.length === 1 && changes[0].includes(coverageDirectory)) {
    changes.pop();
  }
  endGroup();

  if (changes.length > 0) {
    try {
      startGroup("Set up git");
      await exec('git config --global user.name "github-actions"');
      await exec('git config --global user.email "github-actions@github.com"');
      endGroup();

      try {
        startGroup("Stage files");
        await exec(`git add -A -- :!${coverageDirectory}/`);
        await exec(`git add -A -- :!${coverageDirectory}/*`);
      } catch (e) {
        console.error("Unable to add files", e);
      } finally {
        endGroup();
      }
      startGroup("Commit changes");
      execSync(`git commit -m 'chore(automated): Lint commit and format' `);
      endGroup();
      startGroup("Push changes");
      await exec("git push -f");

      debug("Changes pushed onto branch");
      endGroup();
    } catch (e) {
      console.error("Unable to push changes", e);
      setFailed("Unable to push changes to branch");
    }
  }
};
