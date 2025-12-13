import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { spawnSandbox } from "@/services/infrastructure";
import { insertMission } from "@/database/queries/insert-mission";
import { bearerAuth } from "hono/bearer-auth";
import { environmentVariables } from "@/lib/env";

// Input Schema: What the Watcher sends us
const ingestSchema = z.object({
  name: z.string(),
  version: z.string(),
});

const watcherRouter = new Hono()
  .use("/ingest", bearerAuth({ token: environmentVariables.WATCHER_TOKEN }))
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

    await spawnSandbox({ name, version, token: sandboxToken });

    // Return 202 Accepted (Processing started)
    return c.json({ kind: insertedMission.value.kind }, 202);
  });

export { watcherRouter };
