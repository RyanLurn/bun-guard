import type { Args } from "@/parse-inputs";
import { findPreviousVersion } from "@/find-prev-ver";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp } from "node:fs/promises";
import { $ } from "bun";
import { safeDelete } from "@/safe-delete";

async function generateDiff({ pkg, ver }: Args) {
  console.log(`Generating diff for ${pkg}@${ver}...`);

  const prevVer = await findPreviousVersion({ pkg, ver });
  console.log(`Comparing ${pkg}@${prevVer} -> ${pkg}@${ver}`);

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
    console.log("Created initial commit");

    // Install previous version
    await $`bun install ${pkg}@${prevVer} --ignore-scripts`.cwd(workDir);
    console.log(`Installed previous version: ${pkg}@${prevVer}`);

    // Commit previous version
    await $`git add .`.cwd(workDir);
    await $`git commit -m "Install previous version"`.cwd(workDir);
    console.log("Committed previous version");

    // Install target version
    await $`bun install ${pkg}@${ver} --ignore-scripts`.cwd(workDir);
    console.log(`Installed target version: ${pkg}@${ver}`);

    // Add target version
    await $`git add .`.cwd(workDir);
    console.log("Added target version to git");

    // Generate the diff
    const diff =
      await $`git diff --cached -- . ':(exclude)bun.lock' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml'`
        .cwd(workDir)
        .text();
    console.log("Diff generated successfully");

    // Clean up working directory
    await safeDelete(workDir);
    console.log("Cleaned up working directory");

    return diff;
  } catch (error) {
    console.error("Error generating diff:", error);
    console.log("Exiting...");
    process.exit(1);
  }
}

export { generateDiff };
