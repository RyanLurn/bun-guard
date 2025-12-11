import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { spawnSandbox } from "@/services/infrastructure";

// Input Schema: What the Watcher sends us
const ingestSchema = z.object({
  pkg: z.string(),
  ver: z.string(),
});

// Report Schema: What the Sandbox sends us
const reportSchema = z.object({
  missionId: z.string(),
  verdict: z.enum(["safe", "malware", "suspicious"]),
  logs: z.array(z.string()),
});

const internalRouter = new Hono()
  .post("/ingest", zValidator("json", ingestSchema), async (c) => {
    // Because of zValidator, this is fully typed!
    const { pkg, ver } = c.req.valid("json");
    const missionId = Bun.randomUUIDv7();

    console.log(`\n[API] 🧠 Brain received intel: ${pkg}@${ver}`);

    await spawnSandbox({ missionId, pkg, ver });

    // Return 202 Accepted (Processing started)
    return c.json({ status: "queued", id: missionId }, 202);
  })
  .post("/report", zValidator("json", reportSchema), (c) => {
    const { missionId, verdict } = c.req.valid("json");
    console.log(
      `\n[API] 🏁 Mission ${missionId} finished. Verdict: ${verdict.toUpperCase()}`
    );
    return c.json({ received: true });
  });

export { internalRouter };
