import { Lcov, LcovDigest, parse, sum } from "lcov-utils";
import { readFileSync } from "node:fs";
import { endGroup, startGroup } from "@actions/core";
import { stepResponse } from "../main";
import { debug } from "@actions/core";
import { getLcovLines } from "./utils";

export const COV_FAILURE = "⚠️ - Coverage check failed";

/**
 * Get the coverage report and compare with the previous coverage
 * @param prevCoverage - Previous coverage report
 * @param coverageDirectory - Directory to store coverage report
 * @returns Coverage report as a stepResponse object
 */
export const getCoverage = (
  prevCoverage: Lcov | undefined,
  coverageDirectory: string,
  scoreStr: string
): stepResponse => {
  startGroup("Checking test coverage");
  let response: stepResponse | undefined;
  let score = 90;

  try {
    score = parseInt(scoreStr);
  } catch (error) {
    console.error("Error parsing score", "Will default to 90", error);
  }

  try {
    const contents = readFileSync(`${coverageDirectory}/lcov.info`, "utf8");
    const lcov: Lcov = parse(contents);
    debug("Parsed lcov.info");
    const digest: LcovDigest = sum(lcov);
    const totalPercent: number = digest.lines;
    let percentOutput: string;

    const arr = Object.values(lcov).map((e) => {
      const fileName = e.sf;
      const percent = Math.round((e.lh / e.lf) * 1000) / 10;
      const passing = percent > score ? "✅" : "⛔️";
      return `<tr><td>${fileName}</td><td>${percent}%</td><td>${passing}</td></tr>`;
    });
    debug(`Coverage at ${totalPercent}%`);
    if (prevCoverage != undefined) {
      debug("Comparing with previous coverage");
      const prevPercent = getLcovLines(prevCoverage);
      if (prevPercent > totalPercent) {
        debug("Coverage decreased");
        percentOutput = totalPercent + `% (🔻 down from ` + prevPercent + `%)`;
      } else if (prevPercent < totalPercent) {
        debug("Coverage increased");
        percentOutput = totalPercent + `% (⬆️ up from ` + prevPercent + `%)`;
      } else {
        debug("Coverage unchanged");
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
  debug("Finished checking coverage; generated response");
  endGroup();
  return response;
};
