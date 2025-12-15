import * as fs from "fs";
import * as path from "path";
import { convertJsonToTypeScript } from "../lib/converter.js";
import { Logger } from "../utils/logger.js";

interface TypesOptions {
  input: string;
  output?: string;
  outputMode?: string;
  name: string;
  optional?: boolean;
}

export async function generateTypes(options: TypesOptions) {
  const spinner = Logger.spinner("Generating TypeScript types...");

  try {
    // Read input file
    const inputPath = path.resolve(process.cwd(), options.input);
    const jsonContent = fs.readFileSync(inputPath, "utf-8");
    const jsonData = JSON.parse(jsonContent);

    // Generate types
    const typeDefinition = convertJsonToTypeScript(
      jsonData,
      options.name,
      "interface"
    );

    // Determine output path
    let outputPath: string | undefined;
    if (options.outputMode === "same") {
      const inputDir = path.dirname(inputPath);
      const baseName = path.basename(inputPath, ".json");
      outputPath = path.join(inputDir, `${baseName}.d.ts`);
    } else if (options.outputMode === "custom" || options.output) {
      outputPath = path.resolve(process.cwd(), options.output!);
    }

    // Output result
    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, typeDefinition, "utf-8");

      spinner.succeed("TypeScript types generated successfully!");
      Logger.file(outputPath);

      // Count interfaces
      const interfaceCount = (typeDefinition.match(/export interface/g) || [])
        .length;
      Logger.info(
        `Generated ${interfaceCount} interface${
          interfaceCount !== 1 ? "s" : ""
        }`
      );
    } else {
      spinner.stop();
      console.log("\n" + typeDefinition);
    }
  } catch (error) {
    spinner.fail("Failed to generate types");
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    throw error;
  }
}
