import { exec, execSync } from "child_process";
import { stepResponse } from "../../../src/main";
import { COV_FAILURE, getCoverage, getOldCoverage } from "../../../src/scripts/coverage";
const oldCoverage = 83.33;

test("should return stepResponse object", () => {
  const oldCoverage = 80;
  const result: stepResponse = getCoverage(oldCoverage);
  expect(result).toEqual(
    expect.objectContaining({
      error: expect.any(Boolean),
      output: expect.any(String),
    })
  );
});

test("coverage decrease", () => {
  process.chdir("tests/pass_repo");
  execSync("flutter test --coverage");

  const oldCoverage = 95;
  const result: stepResponse = getCoverage(oldCoverage);

  expect(result.output.includes(" (🔻 down from 95%)")).toBe(true);

  process.chdir("../..");
});

test("coverage increase", () => {
  process.chdir("tests/pass_repo");

  const oldCoverage = 5;
  const result: stepResponse = getCoverage(oldCoverage);

  expect(result.output.includes(" (⬆️ up from 5%)")).toBe(true);

  process.chdir("../..");
});

test("coverage same", () => {
  process.chdir("tests/pass_repo");

  const result: stepResponse = getCoverage(oldCoverage);
  expect(result.output.includes(" (no change)")).toBe(true);

  process.chdir("../..");
});

test("no old coverage", () => {
  process.chdir("tests/pass_repo");

  const result: stepResponse = getCoverage(undefined);
  expect(result.output.includes(" (🔻 down from 95%)")).toBe(false);
  expect(result.output.includes(" (⬆️ up from 5%)")).toBe(false);
  expect(result.output.includes(" (no change)")).toBe(false);

  process.chdir("../..");
});

test("fail", () => {
  process.chdir("tests/fail_repo");
  const result: stepResponse = getCoverage(undefined);
  expect(result.error).toBe(true);
  expect(result.output).toEqual(COV_FAILURE);
  process.chdir("../..");
});

test("oldCoverage fail", () => {
  process.chdir("tests/fail_repo");

  const result = getOldCoverage();
  expect(result).toEqual(0);
  process.chdir("../..");
});
test("oldCoverage pass", () => {
  process.chdir("tests/pass_repo");

  const result = getOldCoverage();
  expect(result).toEqual(oldCoverage);
  process.chdir("../..");
});
