import {
  promptMode,
  promptTypeGeneration,
  promptDummyGeneration,
} from "../utils/prompts.js";
import { Logger } from "../utils/logger.js";
import { generateTypes } from "./types.js";
import { generateDummy } from "./dummy.js";
import { generateService } from "./service.js";

export async function runInteractive() {
  try {
    Logger.title("🚀 JSON to TypeScript Interactive CLI");

    const mode = await promptMode();

    if (mode === "types") {
      const answers = await promptTypeGeneration();
      await generateTypes(answers);
    } else if (mode === "dummy") {
      const answers = await promptDummyGeneration();
      await generateDummy(answers);
    } else if (mode === "service") {
      await generateService();
    } else if (mode === "both") {
      // Generate types first
      Logger.info("Step 1: Generating TypeScript types...");
      const typeAnswers = await promptTypeGeneration();
      await generateTypes(typeAnswers);

      Logger.info("\nStep 2: Generating dummy data...");
      const dummyAnswers = await promptDummyGeneration();
      await generateDummy(dummyAnswers);

      Logger.success("\nBoth types and dummy data generated successfully!");
    }
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(error.message);
    } else {
      Logger.error("An unknown error occurred");
    }
    process.exit(1);
  }
}
