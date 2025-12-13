import { write } from "bun";
import { hc } from "hono/client";
import type { RpcClient } from "@bun-guard/api/rpc-client";
import { environmentVariables } from "@/lib/env";

const client = hc<RpcClient>("http://localhost:3000/", {
  headers: {
    Authorization: `Bearer ${environmentVariables.WATCHER_TOKEN}`,
  },
});

// 1. Configuration
const POLL_INTERVAL_MS = 60 * 1000; // Check every minute
const CONCURRENCY = 5; // How many concurrent requests to NPM?

// 2. The VIP List (This would eventually come from your DB)
const VIP_PACKAGES = [
  "react",
  "react-dom",
  "vue",
  "express",
  "axios",
  "lodash",
  "chalk",
  "commander",
  "inquirer",
  "tslib",
];

// 3. State Management (The "Last Seen" versions)
// We persist this to disk so we don't re-trigger scans on restart
const STATE_FILE = "state.json";
let versionCache: Record<string, string> = {};

async function loadState() {
  const file = Bun.file(STATE_FILE);
  if (await file.exists()) {
    versionCache = await file.json();
  }
}

async function saveState() {
  await write(STATE_FILE, JSON.stringify(versionCache, null, 2));
}

// 4. The Worker Function
async function checkPackage(pkgName: string) {
  try {
    // We use the abbreviated metadata endpoint (smaller response)
    // Accept header is critical to get the lightweight JSON
    const response = await fetch(`https://registry.npmjs.org/${pkgName}`, {
      headers: {
        Accept: "application/vnd.npm.install-v1+json",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Could not fetch ${pkgName}: ${response.status}`);
      return;
    }

    const data = await response.json();
    // @ts-expect-error
    const latest = data["dist-tags"]?.latest;

    if (!latest) {
      return;
    }

    const cached = versionCache[pkgName];

    // CASE A: First run (seed the cache)
    if (!cached) {
      versionCache[pkgName] = latest;
      console.log(`[Init] Tracking ${pkgName} @ ${latest}`);
      await report({ pkg: pkgName, ver: latest });
      return;
    }

    // CASE B: New Version Detected!
    if (cached !== latest) {
      console.log(`\n🚀 DETECTED UPDATE: ${pkgName} ${cached} -> ${latest}`);

      await report({ pkg: pkgName, ver: latest });

      // Update Cache
      versionCache[pkgName] = latest;
      await saveState();
    }
  } catch (error) {
    console.error(`Error checking ${pkgName}`, error);
  }
}

// 5. The Scheduler (Concurrency Queue)
async function runLoop() {
  console.log(
    `🛡️  BunGuard Watcher starting... Monitoring ${VIP_PACKAGES.length} packages.`
  );
  await loadState();

  // Initial Run
  await processQueue();

  // Loop
  setInterval(async () => {
    process.stdout.write("\n🔄 Sweeping NPM Registry...");
    await processQueue();
  }, POLL_INTERVAL_MS);
}

async function processQueue() {
  // We use a simple semaphore pattern to limit concurrency
  // so we don't get banned by Cloudflare/NPM
  const queue = [...VIP_PACKAGES];
  const activeWorkers = new Set();

  while (queue.length > 0 || activeWorkers.size > 0) {
    // Fill the pool
    while (queue.length > 0 && activeWorkers.size < CONCURRENCY) {
      const pkg = queue.shift()!;
      const promise = checkPackage(pkg).finally(() =>
        activeWorkers.delete(promise)
      );
      activeWorkers.add(promise);
    }

    // Wait for at least one to finish before looping
    if (activeWorkers.size > 0) {
      await Promise.race(activeWorkers);
    }
  }

  await saveState(); // Checkpoint
  process.stdout.write(` Done.`);
}

async function report({ pkg, ver }: { pkg: string; ver: string }) {
  const res = await client.watcher.ingest.$post({
    json: {
      name: pkg,
      version: ver,
    },
  });

  if (res.ok) {
    const kind = (await res.json()).kind;
    if (kind === "duplicated") {
      console.log(`[Watcher] Mission ${pkg}@${ver} already exists`);
      return;
    }
    console.log(`[Watcher] New mission queued for ${pkg}@${ver}`);
  } else {
    console.error("Something went wrong", res.status);
  }
}

// Start
runLoop();
