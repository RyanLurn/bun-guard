import type { Args } from "@/parse-inputs";
import { $, semver } from "bun";

async function findPreviousVersion({ pkg, ver }: Args) {
  console.log(`Finding previous version for ${pkg}@${ver}`);
  try {
    const allVersions = (await $`bun info ${pkg} versions`.json()) as string[];
    const sortedVersions = allVersions.sort(semver.order);

    const targetVersionIndex = sortedVersions.indexOf(ver);
    if (targetVersionIndex <= 0) {
      throw new Error(
        `Target version ${ver} not found or is the first version`
      );
    }

    let previousVer: string | undefined;

    const isPrerelease = ver.includes("-");
    if (isPrerelease) {
      previousVer = sortedVersions[targetVersionIndex - 1];
      if (previousVer) {
        console.log(`Found previous version: ${previousVer}`);
        return previousVer;
      }
      throw new Error("No previous version found for prerelease");
    }

    for (let i = targetVersionIndex - 1; i >= 0; i--) {
      const candidate = sortedVersions[i];
      if (!candidate?.includes("-")) {
        previousVer = candidate;
        break;
      }
    }

    if (previousVer) {
      console.log(`Found previous stable version: ${previousVer}`);
      return previousVer;
    } else {
      throw new Error("No previous stable version found");
    }
  } catch (error) {
    console.error(`Error finding previous version for ${pkg}@${ver}:`, error);
    console.log("Exiting...");
    process.exit(1);
  }
}

export { findPreviousVersion };
