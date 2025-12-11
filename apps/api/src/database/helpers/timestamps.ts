import { integer } from "drizzle-orm/sqlite-core";
import { jsDate } from "@/database/helpers/js-date";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(jsDate),

  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(jsDate)
    .$onUpdate(() => new Date()),
};

export { timestamps };
