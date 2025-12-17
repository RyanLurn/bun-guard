import { groqProvider } from "@/lib/ai-provider";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { generateObject } from "ai";
import * as z from "zod";

const OutputSchema = z.object({
  summary: z.string(),
  verdict: z.enum(["safe", "suspicious", "malicious"]),
  explanation: z.string(),
});

async function reviewDiff(diff: string) {
  console.log("Reviewing diff:", diff);
  try {
    const { object } = await generateObject({
      model: groqProvider("meta-llama/llama-4-maverick-17b-128e-instruct"),
      system: SYSTEM_PROMPT,
      schema: OutputSchema,
      prompt: diff,
    });

    console.log("Generated object:", object);
    return object;
  } catch (error) {
    console.error("Error reviewing diff:", error);
    console.log("Exiting...");
    process.exit(1);
  }
}

export { reviewDiff };
