import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp } from "node:fs/promises";
import { $ } from "bun";
import { semver } from "bun";

async function main({ name, version }: { name: string; version: string }) {
  // Your test logic here
  console.log(`Testing package: ${name}@${version}`);

  try {
    // Create a temporary directory
    const workDir = await mkdtemp(join(tmpdir(), "bun-guard-test-"));
    console.log("Working Directory:", workDir);

    // Init git repository
    await $`git init`.cwd(workDir);
    console.log("Initialized git repository");

    // Initial commit
    await Bun.write(join(workDir, ".gitattributes"), "* text=auto eol=lf");
    await $`git add .`.cwd(workDir);
    await $`git commit -m "Initial commit"`.cwd(workDir);

    // Find previous version
    console.log(
      `Finding the previous stable version for package: ${name}@${version}`
    );
    const packageVersions =
      (await $`bun info ${name} versions`.json()) as string[];
    const sortedVersions = packageVersions.sort(semver.order);
    const targetVersionIndex = sortedVersions.indexOf(version);
    if (targetVersionIndex <= 0) {
      console.log(
        `Target version ${version} not found or is the first version`
      );
      return;
    }
    let previousVersion: string | undefined;
    for (let i = targetVersionIndex - 1; i >= 0; i--) {
      const candidate = sortedVersions[i];
      if (!candidate?.includes("-")) {
        previousVersion = candidate;
        break;
      }
    }
    if (previousVersion) {
      console.log(`Found previous stable version: ${previousVersion}`);
    } else {
      console.log("No previous stable version found");
      return;
    }

    // Install previous version
    console.log(`Installing previous version: ${name}@${previousVersion}`);
    await $`bun install ${name}@${previousVersion} --ignore-scripts`.cwd(
      workDir
    );

    // Commit previous version
    console.log("Committing previous version");
    await $`git status`.cwd(workDir);
    await $`git add .`.cwd(workDir);
    await $`git commit -m "Install previous version"`.cwd(workDir);

    // Update to target version
    console.log(`Updating to target version: ${name}@${version}`);
    await $`bun install ${name}@${version} --ignore-scripts`.cwd(workDir);

    // Add target version
    console.log("Adding target version to git");
    await $`git status`.cwd(workDir);
    await $`git add .`.cwd(workDir);
    // Don't commit yet, we want to see the diff

    // Generate the diff
    console.log("Generating diff...");
    const diff =
      await $`git diff --cached -- . ':(exclude)bun.lock' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml'`
        .cwd(workDir)
        .text();

    // Save the diff
    console.log("Saving diff content...");
    await Bun.write("test-diff.txt", diff);

    // Preview what will be deleted on clean up
    console.log("Files that would be cleaned up:");
    const fileListing = await $`ls -R ${workDir}`.text();
    await Bun.write("test-file-list.txt", fileListing);

    console.log("Test completed successfully");
  } catch (e) {
    console.log("Test failed:", e);
  }
}

main({ name: "is-odd", version: "3.0.1" });
