import { environmentVariables } from "@/lib/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/database/migrations",
  schema: "./src/database/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: environmentVariables.DATABASE_FILE_NAME,
  },
});
