import { sql } from "drizzle-orm";

const jsDate = sql`(unixepoch('now', 'subsec') * 1000)`;

export { jsDate };
