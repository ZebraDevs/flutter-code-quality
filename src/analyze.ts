import { exec } from "@actions/exec";
import { endGroup, startGroup } from "@actions/core";
import { analyzeDetails, analyzeErrTypes, stepResponse } from "./types";

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
    response = { output: "✅ - Static analysis passed", error: false };
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

    const output = `⛔️ - Static analysis failed; ${issuesFound}</br>
        <details><summary>See details</summary>
        <table>
        <tr><th></th><th>Type</th><th>File name</th><th>Details</th></tr>${errorString.join(
          ""
        )}${warningString.join("")}${infoString.join("")}</table></details>
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

const getErrEmoji = (errType: analyzeErrTypes) => {
  switch (errType) {
    case "error":
      return "⛔️";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
  }
};

const generateTableRow = (err: analyzeDetails, type: analyzeErrTypes) =>
  `<tr><td>${getErrEmoji(type)}</td><td>Error</td><td>${err.file}</td><td>${
    err.details
  }</td></tr>`;
