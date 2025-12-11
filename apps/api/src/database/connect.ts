import { environmentVariables } from "@/lib/env";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/database/schema";

const database = drizzle({
  connection: {
    url: environmentVariables.DATABASE_FILE_NAME,
  },
  schema,
});

export { database };
