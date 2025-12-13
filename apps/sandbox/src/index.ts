import { parseArgs } from "util";
import { hc } from "hono/client";
import type { RpcClient } from "@bun-guard/api/rpc-client";

// 1. Parse Inputs (Passed via CLI args by the API)
// Cloud Run Job passes args like: --name react --version 19.0.0 --token 123
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    name: { type: "string" },
    version: { type: "string" },
    token: { type: "string" },
    apiUrl: { type: "string" },
  },
  strict: true,
  allowPositionals: true,
});

const C2_URL = values.apiUrl || process.env.C2_URL || "http://localhost:3000";
const client = hc<RpcClient>(C2_URL, {
  headers: {
    Authorization: `Bearer ${values.token}`,
  },
});

async function run() {
  console.log(`[Sandbox] 🚁 Initializing...`);
  console.log(`[Sandbox] 📦 Target: ${values.name}@${values.version}`);

  // 2. SIMULATE WORK (The "Detonation")
  // In real life, this is where we run "bun install"
  await Bun.sleep(2000); // Simulate 2s scan time

  // 3. REPORT BACK
  console.log(`[Sandbox] 📡 Reporting findings to Brain...`);

  const res = await client.sandbox.report.$post({
    json: {
      diff: "Mock git diff content",
    },
  });

  if (res.ok) {
    console.log("[Sandbox] ✅ Mission Complete. Exiting.");
    process.exit(0);
  } else {
    console.error("[Sandbox] ❌ Failed to report:", res.status);
    process.exit(1);
  }
}

run();
