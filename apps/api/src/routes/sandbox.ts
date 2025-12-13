import {
  consumeMissionToken,
  type ReportedMission,
} from "@/database/queries/consume-mission-token";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import * as z from "zod";

const reportSchema = z.object({
  diff: z.string(),
});

const reportPath = "/report";

const sandboxRouter = new Hono<{
  Variables: { reportedMission: ReportedMission };
}>()
  .use(
    reportPath,
    bearerAuth({
      verifyToken: async (token, c) => {
        // NOTE: This verifies AND consumes the one-time token.
        const consumeMissionTokenResult = await consumeMissionToken(token);
        if (consumeMissionTokenResult.isErr()) {
          return false;
        }

        const reportedMission = consumeMissionTokenResult.value;
        c.set("reportedMission", reportedMission);

        return true;
      },
    })
  )
  .post(
    reportPath,
    zValidator<
      typeof reportSchema,
      "json",
      { Variables: { reportedMission: ReportedMission } },
      typeof reportPath
    >("json", reportSchema),
    (c) => {
      const { diff } = c.req.valid("json");
      const reportedMission = c.get("reportedMission");

      console.log(
        `\n[API] Received report for mission ${reportedMission.name}@${reportedMission.version}: \n${diff}`
      );

      return c.json({ received: true });
    }
  );

export { sandboxRouter };
