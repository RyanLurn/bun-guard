import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const environmentVariables = createEnv({
  server: {
    DATABASE_FILE_NAME: z.string().min(1),
  },
  runtimeEnv: process.env,
});

export { environmentVariables };
