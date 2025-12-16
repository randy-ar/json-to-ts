import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { generateServiceFile } from "../lib/service-generator.js";
import { ServiceConfig, ServiceMethod } from "../lib/service-types.js";
import {
  promptServiceSetup,
  promptMethodConfig,
  promptAddAnotherMethod,
} from "../utils/service-prompts.js";
import { generateTypes } from "./types.js";
import { generateDummy } from "./dummy.js";

/**
 * Generate service API file
 */
export async function generateService() {
  try {
    Logger.header("🔧 Service API Generator");

    // Step 1: Service setup
    const setup = await promptServiceSetup();

    const config: ServiceConfig = {
      outputPath: path.resolve(process.cwd(), setup.outputPath),
      basePath: setup.basePath || "",
      className: setup.className || "",
      methods: [],
      mode: setup.mode || "create",
    };

    // Step 2: Method configuration (repeater)
    let addingMethods = true;
    let methodCount = 0;
    let context: any = {}; // Context to reuse inputs

    while (addingMethods) {
      methodCount++;
      Logger.info(`\nConfiguring method #${methodCount}...`);

      const method = await promptMethodConfig(context);

      // Update context from method result
      if ((method as any)._context) {
        context = (method as any)._context;
        delete (method as any)._context;
      }

      // Generate new type if needed
      if ((method as any)._newTypeConfig) {
        const typeConfig = (method as any)._newTypeConfig;
        Logger.info("\nGenerating new type...");

        await generateTypes({
          input: typeConfig.inputJson,
          output: typeConfig.outputTypes,
          name: typeConfig.responseType,
          optional: false,
        });

        // Update response type path to be relative import
        const serviceDir = path.dirname(config.outputPath);
        const typesPath = path.resolve(process.cwd(), typeConfig.outputTypes);
        let relativePath = path.relative(serviceDir, typesPath);

        // Remove .ts extension and ensure it starts with ./
        relativePath = relativePath.replace(/\.ts$/, "").replace(/\.d$/, "");
        if (!relativePath.startsWith(".")) {
          relativePath = "./" + relativePath;
        }

        method.responseTypePath = relativePath;
        delete (method as any)._newTypeConfig;
      }

      // Generate new dummy if needed
      if ((method as any)._newDummyConfig) {
        const dummyConfig = (method as any)._newDummyConfig;
        Logger.info("\nGenerating new dummy data...");

        await generateDummy({
          input: dummyConfig.inputJson,
          types: dummyConfig.typesFile,
          typeName: dummyConfig.typeName,
          functionName: dummyConfig.dummyFunction,
          output: dummyConfig.outputDummy,
          async: true,
          wrapper: true,
        });

        // Update dummy function path to be relative import
        const serviceDir = path.dirname(config.outputPath);
        const dummyPath = path.resolve(process.cwd(), dummyConfig.outputDummy);
        let relativePath = path.relative(serviceDir, dummyPath);

        // Remove .ts extension and ensure it starts with ./
        relativePath = relativePath.replace(/\.ts$/, "");
        if (!relativePath.startsWith(".")) {
          relativePath = "./" + relativePath;
        }

        method.dummyFunctionPath = relativePath;
        delete (method as any)._newDummyConfig;
      }

      config.methods.push(method);

      // Ask to add another method
      addingMethods = await promptAddAnotherMethod();
    }

    // Step 3: Generate service file
    const spinner = Logger.spinner("Generating service file...");

    try {
      generateServiceFile(config);

      spinner.succeed("Service file generated successfully!");
      Logger.file(config.outputPath);
      Logger.info("");
      Logger.success(`✨ Generated ${config.methods.length} method(s)`);

      // Show usage example
      Logger.info("");
      Logger.info("💡 Usage example:");
      const instanceName =
        config.className.replace(/Service$/, "").replace(/Api$/, "") + "Api";
      Logger.info(
        `   import { ${instanceName} } from './${path.basename(
          config.outputPath,
          ".ts"
        )}';`
      );
      Logger.info(
        `   const result = await ${instanceName}.${config.methods[0].name}();`
      );
    } catch (error) {
      spinner.fail("Failed to generate service file");
      if (error instanceof Error) {
        Logger.error(error.message);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    process.exit(1);
  }
}
