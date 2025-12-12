import { database } from "@/database/connect";
import { missionTable } from "@/database/schema";
import { LibsqlError } from "@libsql/client";
import { DrizzleQueryError } from "drizzle-orm";
import { ok, err, type Result } from "neverthrow";

type InsertMission = typeof missionTable.$inferInsert;
interface InsertedMission extends Pick<InsertMission, "name" | "version"> {
  kind: "new" | "duplicated";
}

async function insertMission({
  name,
  version,
  sandboxToken,
}: InsertMission): Promise<
  Result<InsertedMission, LibsqlError | DrizzleQueryError | Error>
> {
  try {
    const [insertedMission] = await database
      .insert(missionTable)
      .values({ name, version, sandboxToken })
      .onConflictDoNothing({
        target: [missionTable.name, missionTable.version],
      })
      .returning();

    if (!insertedMission) {
      console.log("[DB] Mission already exists:", { name, version });
      return ok({ kind: "duplicated", name, version });
    }

    console.log("[DB] Mission inserted:", { name, version });
    return ok({ kind: "new", name, version });
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      const originalError = error.cause;
      if (originalError instanceof LibsqlError) {
        if (originalError.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
          console.error(
            "[DB] Unexpected primary key constraint violation while attemting to insert mission:",
            originalError
          );
          return err(originalError);
        }

        console.error(
          "[DB] Libsql error occurred while attemting to insert mission:",
          originalError
        );
        return err(originalError);
      }

      console.error(
        "[DB] Drizzle query error occurred while attemting to insert mission:",
        {
          errorName: error.name,
          errorMessage: error.message,
        }
      );
      return err(error);
    }

    console.error(
      "[DB] Unknown error occurred while attemting to insert mission:",
      error
    );
    return err(
      new Error("Unknown error occurred while attemting to insert mission")
    );
  }
}

export { insertMission };
