import { database } from "@/database/connect";
import { missionTable } from "@/database/schema";
import { LibsqlError } from "@libsql/client";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { err, ok, Result } from "neverthrow";

type ReportedMission = typeof missionTable.$inferSelect;

async function consumeMissionToken(
  token: string
): Promise<Result<ReportedMission, LibsqlError | DrizzleQueryError | Error>> {
  try {
    const updateResult = await database
      .update(missionTable)
      .set({
        status: "sandbox_reported",
        sandboxToken: null,
      })
      .where(eq(missionTable.sandboxToken, token))
      .returning();

    if (updateResult.length > 1) {
      const errorMessage = `Multiple unexpected missions found for sandbox token: ${token}`;
      console.error(errorMessage);
      const multipleError = new Error(errorMessage);
      return err(multipleError);
    }

    const reportedMission = updateResult[0];

    if (!reportedMission) {
      const notFoundMessage = `No mission found for sandbox token: ${token}`;
      console.error(notFoundMessage);
      const emptyError = new Error(notFoundMessage);
      return err(emptyError);
    }

    console.log(
      `[DB] Consumed sandbox token ${token} for mission ${reportedMission.name}@${reportedMission.version}`
    );

    return ok(reportedMission);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      const originalError = error.cause;
      if (originalError instanceof LibsqlError) {
        console.error(
          "[DB] Libsql error occurred while attemting to consume mission token:",
          originalError
        );
        return err(originalError);
      }

      console.error(
        "[DB] Drizzle query error occurred while attemting to consume mission token:",
        {
          errorName: error.name,
          errorMessage: error.message,
        }
      );
      return err(error);
    }

    console.error(
      "[DB] Unknown error occurred while attemting to consume mission token:",
      error
    );
    return err(
      new Error(
        "Unknown error occurred while attemting to consume mission token"
      )
    );
  }
}

export { consumeMissionToken };
export type { ReportedMission };
