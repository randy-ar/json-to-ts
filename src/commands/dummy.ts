import * as fs from "fs";
import * as path from "path";
import { generateDummyData } from "../lib/dummy-generator.js";
import { DummyGeneratorOptions } from "../lib/types.js";
import { Logger } from "../utils/logger.js";

interface DummyOptions {
  input: string;
  types: string;
  typeName: string;
  functionName: string;
  output?: string;
  outputMode?: string;
  async?: boolean;
  wrapper?: boolean;
}

export async function generateDummy(options: DummyOptions) {
  const spinner = Logger.spinner("Generating dummy data...");

  try {
    // Read input file
    const inputPath = path.resolve(process.cwd(), options.input);
    const jsonContent = fs.readFileSync(inputPath, "utf-8");
    const jsonData = JSON.parse(jsonContent);

    // Verify types file exists
    const typesPath = path.resolve(process.cwd(), options.types);
    if (!fs.existsSync(typesPath)) {
      throw new Error(`Types file not found: ${typesPath}`);
    }

    // Determine output path
    let outputPath: string | undefined;
    if (options.outputMode === "same") {
      const inputDir = path.dirname(inputPath);
      const baseName = path.basename(inputPath, ".json");
      outputPath = path.join(inputDir, `${baseName}.dummy.ts`);
    } else if (options.outputMode === "custom" || options.output) {
      outputPath = path.resolve(process.cwd(), options.output!);
    }

    // Generate dummy data
    const generatorOptions: DummyGeneratorOptions = {
      input: inputPath,
      types: typesPath,
      typeName: options.typeName,
      functionName: options.functionName,
      output: outputPath,
      async: options.async !== false,
      wrapper: options.wrapper !== false,
    };

    const dummyCode = generateDummyData(jsonData, generatorOptions);

    // Output result
    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, dummyCode, "utf-8");

      spinner.succeed("Dummy data generated successfully!");
      Logger.file(outputPath);

      // Show usage example
      Logger.info("\n💡 Usage in service API:");
      Logger.code(
        `   import { ${options.functionName} } from './${path.basename(
          outputPath,
          ".ts"
        )}';`
      );
      Logger.code(`   return await ${options.functionName}(id);`);
    } else {
      spinner.stop();
      console.log("\n" + dummyCode);
    }
  } catch (error) {
    spinner.fail("Failed to generate dummy data");
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    throw error;
  }
}
