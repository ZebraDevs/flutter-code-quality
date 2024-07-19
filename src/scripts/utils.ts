import { endGroup, startGroup } from "@actions/core";
import { readFileSync } from "fs";
import { Lcov, parse, sum } from "lcov-utils";
export const COV_FILE = "lcov.info";

export const importLcov = (file_directory: string): Lcov => {
  startGroup("Retrieving coverage report");
  try {
    const contents = readFileSync(`${file_directory}/${COV_FILE}`, "utf8");
    endGroup();
    return parse(contents);
  } catch (e) {
    console.error("Unable to find coverage report.", e);
    endGroup();
    throw e;
  }
};

export const getLcovLines = (report: Lcov): number => sum(report).lines;
