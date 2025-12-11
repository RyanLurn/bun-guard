import { timestamps } from "@/database/helpers/timestamps";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const missionTable = sqliteTable(
  "missions",
  {
    name: text("name").notNull(),
    version: text("version").notNull(),
    status: text("status", {
      enum: ["processing", "completed", "failed"],
    })
      .notNull()
      .default("processing"),
    verdict: text("verdict", {
      enum: ["undetermined", "safe", "suspicious", "malicious"],
    })
      .notNull()
      .default("undetermined"),
    summary: text("summary"),
    sandboxToken: text("sandbox_token"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.name, table.version] })]
);

export { missionTable };
