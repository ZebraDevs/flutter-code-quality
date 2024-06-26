import { endGroup, startGroup } from "@actions/core";
import { exec } from "@actions/exec";

export const setup = async () => {
  startGroup("Set up Flutter");
  try {
    await exec("flutter pub get");
    await exec("dart format . -l 120");
    await exec("dart fix --apply");
  } catch (e) {
    console.error("Error during flutter setup", e);
  }
  endGroup();
};
