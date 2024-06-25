import { Lcov, LcovDigest, parse, sum } from "lcov-utils";
import { readFileSync } from "node:fs";
import { endGroup, startGroup } from "@actions/core";
import { stepResponse } from "./types";

export const getCoverage = (oldCoverage: number | undefined): stepResponse => {
  startGroup("Checking test coverage");
  let response: stepResponse | undefined;

  try {
    const contents = readFileSync("coverage/lcov.info", "utf8");
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

    if (oldCoverage != undefined) {
      if (oldCoverage > totalPercent) {
        percentOutput = totalPercent + `% (🔻 down from ` + oldCoverage + `)`;
      } else if (oldCoverage < totalPercent) {
        percentOutput = totalPercent + `% (👆 up from ` + oldCoverage + `)`;
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
    return { output: str, error: false };
  } catch (error) {
    response = { output: "⚠️ - Coverage check failed", error: true };
  } finally {
    if (response == undefined) {
      response = { output: "⚠️ - Coverage check failed", error: true };
    }
  }
  endGroup();
  return response;
};

export const getOldCoverage = (): number | undefined => {
  let value: number | undefined;
  startGroup("Retrieving existing coverage value");
  try {
    const contents = readFileSync("coverage/lcov.info", "utf8");
    const lcov: Lcov = parse(contents);
    const digest: LcovDigest = sum(lcov);
    value = digest.lines;
  } catch (e) {
    console.error("Unable to find existing coverage report.", e);
  }
  endGroup();
  return value;
};
