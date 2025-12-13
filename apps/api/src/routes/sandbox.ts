import {
  selectMissionBySandboxToken,
  type SelectedMission,
} from "@/database/queries/select-mission";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import * as z from "zod";

const reportSchema = z.object({
  diff: z.string(),
});

const reportPath = "/report";

const sandboxRouter = new Hono<{
  Variables: { reportedMission: SelectedMission };
}>()
  .use(
    reportPath,
    bearerAuth({
      verifyToken: async (token, c) => {
        const selectMissionResult = await selectMissionBySandboxToken(token);
        if (selectMissionResult.isErr()) {
          return false;
        }

        c.set("reportedMission", selectMissionResult.value);
        return true;
      },
    })
  )
  .post(
    reportPath,
    zValidator<
      typeof reportSchema,
      "json",
      { Variables: { reportedMission: SelectedMission } },
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
