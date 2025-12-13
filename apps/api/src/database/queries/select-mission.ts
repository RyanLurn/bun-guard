import { database } from "@/database/connect";
import { missionTable } from "@/database/schema";
import { LibsqlError } from "@libsql/client";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { err, ok, Result } from "neverthrow";

type SelectedMission = typeof missionTable.$inferSelect;

async function selectMissionBySandboxToken(
  token: string
): Promise<Result<SelectedMission, LibsqlError | DrizzleQueryError | Error>> {
  try {
    const selectResult = await database
      .select()
      .from(missionTable)
      .where(eq(missionTable.sandboxToken, token));

    if (selectResult.length > 1) {
      const errorMessage = `Multiple unexpected missions found for sandbox token: ${token}`;
      console.error(errorMessage);
      const multipleError = new Error(errorMessage);
      return err(multipleError);
    }

    const selectedMission = selectResult[0];

    if (!selectedMission) {
      const notFoundMessage = `No mission found for sandbox token: ${token}`;
      console.error(notFoundMessage);
      const emptyError = new Error(notFoundMessage);
      return err(emptyError);
    }

    console.log(
      `[DB] Found mission ${selectedMission.name}@${selectedMission.version} for sandbox token: ${token}`
    );

    return ok(selectedMission);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      const originalError = error.cause;
      if (originalError instanceof LibsqlError) {
        console.error(
          "[DB] Libsql error occurred while attemting to select mission:",
          originalError
        );
        return err(originalError);
      }

      console.error(
        "[DB] Drizzle query error occurred while attemting to select mission:",
        {
          errorName: error.name,
          errorMessage: error.message,
        }
      );
      return err(error);
    }

    console.error(
      "[DB] Unknown error occurred while attemting to select mission:",
      error
    );
    return err(
      new Error("Unknown error occurred while attemting to select mission")
    );
  }
}

export { selectMissionBySandboxToken };
export type { SelectedMission };
