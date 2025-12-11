import { timestamps } from "@/database/helpers/timestamps";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const missionTable = sqliteTable("missions", {
  package: text("package").notNull(),
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
});

export { missionTable };
