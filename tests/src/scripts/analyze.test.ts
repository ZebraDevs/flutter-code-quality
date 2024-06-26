import { stepResponse } from "../../../src/main";
import {
  getAnalyze,
  getErrEmoji,
  generateTableRow,
  ANALYZE_SUCCESS,
  ANALYZE_FAILURE,
} from "../../../src/scripts/analyze";

test("getAnalyze on passing repo", async () => {
  process.chdir("tests/pass_repo");
  const result: stepResponse = await getAnalyze();

  expect(result).toBeDefined();
  expect(result).toHaveProperty("error");
  expect(result).toHaveProperty("output");
  expect(result.error).toBe(false);
  expect(result.output).toBe(ANALYZE_SUCCESS);

  process.chdir("../..");
}, 30000);

test("getAnalyze on failing repo", async () => {
  process.chdir("tests/fail_repo");
  const result: stepResponse = await getAnalyze();

  expect(result).toBeDefined();
  expect(result).toHaveProperty("error");
  expect(result).toHaveProperty("output");
  expect(result.error).toBe(true);
  expect(result.output.includes(ANALYZE_FAILURE)).toBe(true);

  process.chdir("../..");
}, 30000);

test("getErrEmoji", async () => {
  const errorEmoji = getErrEmoji("error");
  const warningEmoji = getErrEmoji("warning");
  const infoEmoji = getErrEmoji("info");

  expect(errorEmoji).toBe("⛔️");
  expect(warningEmoji).toBe("⚠️");
  expect(infoEmoji).toBe("ℹ️");
}, 30000);

test("generateTableRow", () => {
  const errorDetails = {
    file: "example.dart",
    details: "This is an error message",
  };
  const warningDetails = {
    file: "example.dart",
    details: "This is a warning message",
  };
  const infoDetails = {
    file: "example.dart",
    details: "This is an info message",
  };

  const errorTableRow = generateTableRow(errorDetails, "error");
  const warningTableRow = generateTableRow(warningDetails, "warning");
  const infoTableRow = generateTableRow(infoDetails, "info");

  expect(errorTableRow).toBe(
    `<tr><td>⛔️</td><td>Error</td><td>${errorDetails.file}</td><td>${errorDetails.details}</td></tr>`
  );
  expect(warningTableRow).toBe(
    `<tr><td>⚠️</td><td>Error</td><td>${warningDetails.file}</td><td>${warningDetails.details}</td></tr>`
  );
  expect(infoTableRow).toBe(
    `<tr><td>ℹ️</td><td>Error</td><td>${infoDetails.file}</td><td>${infoDetails.details}</td></tr>`
  );
}, 30000);
