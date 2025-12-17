import { generateDiff } from "@/generate-diff";
import { parseInputs } from "@/parse-inputs";
import { reviewDiff } from "@/review-diff";

const inputs = parseInputs();

const diff = await generateDiff(inputs);

const reviewResult = await reviewDiff(diff);

console.log("Review result:");
console.log("Summary:", reviewResult.summary);
console.log("Verdict:", reviewResult.verdict);
console.log("Explanation:", reviewResult.explanation);
