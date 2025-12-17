import { $ } from "bun";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

async function safeDelete(path: string) {
  // 1. Resolve absolute path to avoid relative path trickery
  const absolutePath = resolve(path);
  const systemTemp = resolve(tmpdir());

  // 2. THE GUARD: Must be inside system temp
  if (!absolutePath.startsWith(systemTemp)) {
    throw new Error(
      `SAFETY PREVENTED DELETION: Tried to delete ${absolutePath}, which is outside system temp (${systemTemp})`
    );
  }

  // 3. Double Check: Must have our specific prefix
  // e.g. "bun-guard-"
  if (!absolutePath.includes("bun-guard-")) {
    throw new Error(
      `SAFETY PREVENTED DELETION: Path ${absolutePath} does not look like a BunGuard temp dir`
    );
  }

  // 4. Proceed
  await $`rm -rf ${absolutePath}`.quiet();
  console.log(`Deleted ${absolutePath}`);
}

export { safeDelete };
