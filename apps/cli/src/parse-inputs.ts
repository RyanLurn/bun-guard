import { parseArgs } from "util";
import * as z from "zod";

const ArgsSchema = z.object({
  pkg: z.string(),
  ver: z.string(),
});

type Args = z.infer<typeof ArgsSchema>;

function parseInputs() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      pkg: {
        type: "string",
        short: "P",
      },
      ver: {
        type: "string",
        short: "V",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const parseResult = ArgsSchema.safeParse(values);
  if (!parseResult.success) {
    console.error(z.prettifyError(parseResult.error));
    process.exit(1);
  }

  const validatedValues = parseResult.data;
  console.log("Parsed inputs:", validatedValues);
  return validatedValues;
}

export { parseInputs };
export type { Args };
