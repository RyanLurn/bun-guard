import { parseArgs } from "util";
import { hc } from "hono/client";
import type { RpcClient } from "@bun-guard/api/rpc-client";

// 1. Parse Inputs (Passed via CLI args by the API)
// Cloud Run Job passes args like: --mission 123 --pkg react --ver 19.0.0
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    mission: { type: "string" },
    pkg: { type: "string" },
    ver: { type: "string" },
    apiUrl: { type: "string" },
  },
  strict: true,
  allowPositionals: true,
});

const C2_URL = values.apiUrl || process.env.C2_URL || "http://localhost:3000";
const client = hc<RpcClient>(C2_URL);

async function run() {
  console.log(`[Sandbox] 🚁 Started Mission: ${values.mission}`);
  console.log(`[Sandbox] 📦 Target: ${values.pkg}@${values.ver}`);

  // 2. SIMULATE WORK (The "Detonation")
  // In real life, this is where we run "bun install"
  await Bun.sleep(2000); // Simulate 2s scan time

  const isMalware = values.pkg?.includes("malware"); // Mock logic

  // 3. REPORT BACK
  console.log(`[Sandbox] 📡 Reporting findings to Brain...`);

  const res = await client.internal.report.$post({
    json: {
      missionId: values.mission || "unknown",
      verdict: isMalware ? "malware" : "safe",
      logs: ["Network clean", "FS clean"],
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
