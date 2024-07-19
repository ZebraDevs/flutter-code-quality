import { Lcov, LcovDigest, parse, sum } from "lcov-utils";
import { readFileSync } from "node:fs";
import { endGroup, startGroup } from "@actions/core";
import { stepResponse } from "../main";
import { getLcovLines } from "./utils";

export const COV_FAILURE = "⚠️ - Coverage check failed";

export const getCoverage = (prevCoverage: Lcov | undefined, coverageDirectory: string): stepResponse => {
  startGroup("Checking test coverage");
  let response: stepResponse | undefined;

  try {
    const contents = readFileSync(`${coverageDirectory}/lcov.info`, "utf8");
    const lcov: Lcov = parse(contents);
    const digest: LcovDigest = sum(lcov);
    const totalPercent: number = digest.lines;
    let percentOutput: string;

    const arr = Object.values(lcov).map((e) => {
      const fileName = e.sf;
      const percent = Math.round((e.lh / e.lf) * 1000) / 10;
      const passing = percent > 96 ? "✅" : "⛔️";
      return `<tr><td>${fileName}</td><td>${percent}%</td><td>${passing}</td></tr>`;
    });

    if (prevCoverage != undefined) {
      const prevPercent = getLcovLines(prevCoverage);
      if (prevPercent > totalPercent) {
        percentOutput = totalPercent + `% (🔻 down from ` + prevPercent + `%)`;
      } else if (prevPercent < totalPercent) {
        percentOutput = totalPercent + `% (⬆️ up from ` + prevPercent + `%)`;
      } else {
        percentOutput = totalPercent + `% (no change)`;
      }
    } else {
      percentOutput = totalPercent + "%";
    }

    const str = `📈 - Code coverage: ${percentOutput}
    <br>
    <details><summary>See details</summary>
    <table>
    <tr><th>File Name</th><th>%</th><th>Passing?</th></tr>
        ${arr.join("")}
    </table>
    </details>`;
    response = { output: str, error: false };
  } catch (error) {
    console.error("Error checking coverage", error);
    response = { output: COV_FAILURE, error: true };
  }
  endGroup();
  return response;
};
