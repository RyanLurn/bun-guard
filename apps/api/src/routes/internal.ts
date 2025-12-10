import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// Input Schema: What the Watcher sends us
const ingestSchema = z.object({
  pkg: z.string(),
  ver: z.string(),
});

export const internalRouter = new Hono().post(
  "/ingest",
  zValidator("json", ingestSchema),
  (c) => {
    // Because of zValidator, this is fully typed!
    const { pkg, ver } = c.req.valid("json");

    console.log(`\n[API] 🧠 Brain received intel: ${pkg}@${ver}`);
    console.log(`[API] 📝 TODO: Check DB lock -> Spawn Sandbox`);

    // Return 202 Accepted (Processing started)
    return c.json({ status: "queued", id: "mock-mission-id" }, 202);
  }
);
