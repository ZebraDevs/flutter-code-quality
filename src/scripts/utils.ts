import { endGroup, startGroup } from "@actions/core";
import { readFileSync } from "fs";
import { Lcov, parse, sum } from "lcov-utils";
export const COV_FILE = "lcov.info";

/**
 * Import the Lcov report
 * @param file_directory - Directory containing the Lcov report
 * @returns Lcov report
 */
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

/**
 * Get the total lines covered in the Lcov report
 * @param report - Lcov report
 * @returns Total lines covered
 */
export const getLcovLines = (report: Lcov): number => sum(report).lines;

/**
 * Convert ArrayBuffer to Buffer
 * @param arrayBuffer - ArrayBuffer to convert
 * @returns Data in Buffer format
 */
export const toBuffer = (arrayBuffer: ArrayBuffer) => {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
};
