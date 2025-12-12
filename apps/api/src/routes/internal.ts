import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { spawnSandbox } from "@/services/infrastructure";
import { insertMission } from "@/database/queries/insert-mission";

// Input Schema: What the Watcher sends us
const ingestSchema = z.object({
  name: z.string(),
  version: z.string(),
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
    const { name, version } = c.req.valid("json");
    console.log(`\n[API] 🧠 Brain received intel: ${name}@${version}`);

    const sandboxToken = Bun.randomUUIDv7();
    const insertedMission = await insertMission({
      name,
      version,
      sandboxToken,
    });

    if (insertedMission.isErr()) {
      return c.json({ error: "Failed to insert mission" }, 500);
    }

    if (insertedMission.value.kind === "duplicated") {
      return c.json({ kind: insertedMission.value.kind }, 200);
    }

    const missionId = Bun.randomUUIDv7();
    await spawnSandbox({ missionId, name, version });

    // Return 202 Accepted (Processing started)
    return c.json({ kind: insertedMission.value.kind }, 202);
  })
  .post("/report", zValidator("json", reportSchema), (c) => {
    const { missionId, verdict } = c.req.valid("json");
    console.log(
      `\n[API] 🏁 Mission ${missionId} finished. Verdict: ${verdict.toUpperCase()}`
    );
    return c.json({ received: true });
  });

export { internalRouter };
