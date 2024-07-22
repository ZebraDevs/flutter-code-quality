import { COVERAGE_DIR } from "../../../src/main";
import { getTest, TEST_ERROR, TEST_SUCCESS } from "../../../src/scripts/runTests";

test("all tests pass", async () => {
  process.chdir("tests/pass_repo");
  const result = await getTest(COVERAGE_DIR);

  expect(result.error).toBe(false);
  expect(result.output).toEqual(TEST_SUCCESS);

  process.chdir("../..");
}, 30000);

test("no tests pass", async () => {
  process.chdir("tests/fail_repo");
  const result = await getTest(COVERAGE_DIR);

  expect(result.error).toBe(true);
  expect(result.output.includes("⛔️ -")).toBe(true);

  process.chdir("../..");
}, 30000);

test("no tests to run", async () => {
  const result = await getTest(COVERAGE_DIR);

  expect(result.error).toBe(true);
  expect(result.output).toEqual(TEST_ERROR);
}, 30000);
