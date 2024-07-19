import { exec, execSync } from "child_process";
import { stepResponse } from "../../../src/main";
import { COV_FAILURE, getCoverage } from "../../../src/scripts/coverage";
import { getLcovLines, importLcov } from "../../../src/scripts/utils";
import { parse } from "lcov-utils";
const oldCoverage = 83.33;

// test("should return stepResponse object", () => {
//   // const oldCoverage =
//   const result: stepResponse = getCoverage(oldCoverage);

//   expect(result).toEqual(
//     expect.objectContaining({
//       error: expect.any(Boolean),
//       output: expect.any(String),
//     })
//   );
// });

test("coverage decrease", () => {
  process.chdir("tests/pass_repo");
  execSync("flutter test --coverage");

  const result: stepResponse = getCoverage(
    parse(`SF:lib/main.dart
DA:3,1
DA:8,1
DA:10,1
DA:17,1
DA:21,1
DA:22,1
DA:28,1
DA:30,1
DA:32,1
DA:33,1
DA:34,1
DA:35,1
LF:12
LH:12
end_of_record
`),
    "coverage"
  );

  expect(result.output.includes(" (🔻 down from")).toBe(true);

  process.chdir("../..");
});

test("coverage increase", () => {
  process.chdir("tests/pass_repo");

  const result: stepResponse = getCoverage(
    parse(`
    SF:lib/main.dart
DA:3,0
DA:8,0
DA:10,0
DA:17,0
DA:21,0
DA:22,0
DA:28,0
DA:30,0
DA:32,0
DA:33,0
DA:34,0
DA:35,0
LF:12
LH:0
end_of_record
`),
    "coverage"
  );
  console.log(result.output);
  expect(result.output.includes(" (⬆️ up from")).toBe(true);

  process.chdir("../..");
});

test("coverage same", () => {
  process.chdir("tests/pass_repo");

  const result: stepResponse = getCoverage(
    parse(`SF:lib/main.dart
DA:3,0
DA:8,2
DA:10,1
DA:17,1
DA:21,1
DA:22,1
DA:28,0
DA:30,1
DA:32,1
DA:33,4
DA:34,1
DA:35,1
LF:12
LH:10
end_of_record
`),
    "coverage"
  );
  expect(result.output.includes(" (no change)")).toBe(true);

  process.chdir("../..");
});

test("no old coverage", () => {
  process.chdir("tests/pass_repo");

  const result: stepResponse = getCoverage(undefined, "coverage");
  expect(result.output.includes(" (🔻 down from 95%)")).toBe(false);
  expect(result.output.includes(" (⬆️ up from 5%)")).toBe(false);
  expect(result.output.includes(" (no change)")).toBe(false);

  process.chdir("../..");
});

test("fail", () => {
  process.chdir("tests/fail_repo");
  try {
    const result: stepResponse = getCoverage(undefined, "coverage");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
  process.chdir("../..");
});

test("oldCoverage pass", () => {
  process.chdir("tests/pass_repo");

  const result = getLcovLines(importLcov("coverage"));
  expect(result).toEqual(oldCoverage);
  process.chdir("../..");
});
