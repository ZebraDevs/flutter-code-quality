import { exec } from "@actions/exec";

import { endGroup, startGroup } from "@actions/core";
import { stepResponse } from "../main";

export const ANALYZE_SUCCESS = "✅ - Static analysis passed";
export const ANALYZE_FAILURE = "⛔️ - Static analysis failed";
const ANALYZE_PASS_LOG = "No issues found!";

export type analyzeDetails = { file: string; details: string };

export type analyzeErrTypes = "error" | "warning" | "info";

/**
 * Run static analysis on the codebase
 * @returns Analysis result as a stepResponse object
 */
export const getAnalyze = async (): Promise<stepResponse> => {
  startGroup("Analyzing code");
  let response: stepResponse | undefined;
  let stdout: string = "";
  try {
    await exec("dart analyze", [], {
      listeners: {
        stdout: (data) => (stdout += data.toString()),
      },
    });

    if (stdout.includes(ANALYZE_PASS_LOG)) {
      response = { output: ANALYZE_SUCCESS, error: false };
    } else {
      throw new Error("Issues found");
    }
  } catch (error) {
    const arr = stdout.trim().split("\n");

    const errors: analyzeDetails[] = [];
    const warnings: analyzeDetails[] = [];
    const infos: analyzeDetails[] = [];

    arr
      .slice(2, -2)
      .map((e: string) =>
        e
          .split("-")
          .slice(0, -1)
          .map((e: string) => e.trim())
      )
      .forEach((e: string[]) => {
        const obj = { file: e[1], details: e[0] };
        if (e[0].toLowerCase() == "error") {
          errors.push(obj);
        } else if (e[0].toLowerCase() == "warning") {
          warnings.push(obj);
        } else {
          infos.push(obj);
        }
        return;
      });

    const errorString = errors.map((e) => generateTableRow(e, "error"));
    const warningString = warnings.map((e) => generateTableRow(e, "warning"));
    const infoString = infos.map((e) => generateTableRow(e, "info"));

    const issuesFound = arr.at(-1);

    const output = `${ANALYZE_FAILURE}; ${issuesFound}</br>
        <details><summary>See details</summary>
        <table>
        <tr><th></th><th>Type</th><th>File name</th><th>Details</th></tr>${errorString.join("")}${warningString.join(
      ""
    )}${infoString.join("")}</table></details>
        `;

    response = { output: output, error: true };
  } finally {
    if (response == undefined) {
      response = { output: " - Error running analysis", error: true };
    }
  }
  endGroup();
  return response;
};

/**
 * Get the emoji corresponding to the error type
 * @param errType - Type of error
 * @returns Emoji corresponding to the error type
 */
export const getErrEmoji = (errType: analyzeErrTypes) => {
  switch (errType) {
    case "error":
      return "⛔️";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
  }
};

/**
 * Generate a table row for the error
 * @param err - Error details
 * @param type - Type of error
 * @returns Formatted table row for the error
 */
export const generateTableRow = (err: analyzeDetails, type: analyzeErrTypes) =>
  `<tr><td>${getErrEmoji(type)}</td><td>Error</td><td>${err.file}</td><td>${err.details}</td></tr>`;
