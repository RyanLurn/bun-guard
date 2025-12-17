import { createGroq } from "@ai-sdk/groq";
import { envVars } from "./env";

const groqProvider = createGroq({
  apiKey: envVars.GROQ_API_KEY,
});

export { groqProvider };
