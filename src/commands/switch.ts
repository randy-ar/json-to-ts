import * as fs from "fs";
import * as path from "path";
import { processFiles } from "../lib/code-switcher.js";
import { Logger } from "../utils/logger.js";

interface SwitchOptions {
  files?: string[];
  directory?: string;
  pattern?: string;
}

/**
 * Find TypeScript files in directory
 */
function findTypeScriptFiles(dir: string, pattern?: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          traverse(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        // Check pattern if provided
        if (!pattern || entry.name.includes(pattern)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Switch to dummy mode
 */
export async function useDummy(options: SwitchOptions) {
  const spinner = Logger.spinner("Switching to dummy mode...");

  try {
    let filesToProcess: string[] = [];

    if (options.files && options.files.length > 0) {
      filesToProcess = options.files;
    } else if (options.directory) {
      const dir = path.resolve(process.cwd(), options.directory);
      filesToProcess = findTypeScriptFiles(dir, options.pattern);
    } else {
      throw new Error("Please specify --files or --directory");
    }

    if (filesToProcess.length === 0) {
      spinner.warn("No files found to process");
      return;
    }

    const { processed, errors } = processFiles(filesToProcess, "dummy");

    if (errors.length > 0) {
      spinner.fail("Some files failed to process");
      errors.forEach((err) => Logger.error(err));
    } else {
      spinner.succeed(`Switched ${processed.length} file(s) to dummy mode`);
    }

    processed.forEach((file) => Logger.file(file));
  } catch (error) {
    spinner.fail("Failed to switch to dummy mode");
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    throw error;
  }
}

/**
 * Switch to live mode
 */
export async function useLive(options: SwitchOptions) {
  const spinner = Logger.spinner("Switching to live mode...");

  try {
    let filesToProcess: string[] = [];

    if (options.files && options.files.length > 0) {
      filesToProcess = options.files;
    } else if (options.directory) {
      const dir = path.resolve(process.cwd(), options.directory);
      filesToProcess = findTypeScriptFiles(dir, options.pattern);
    } else {
      throw new Error("Please specify --files or --directory");
    }

    if (filesToProcess.length === 0) {
      spinner.warn("No files found to process");
      return;
    }

    const { processed, errors } = processFiles(filesToProcess, "live");

    if (errors.length > 0) {
      spinner.fail("Some files failed to process");
      errors.forEach((err) => Logger.error(err));
    } else {
      spinner.succeed(`Switched ${processed.length} file(s) to live mode`);
    }

    processed.forEach((file) => Logger.file(file));
  } catch (error) {
    spinner.fail("Failed to switch to live mode");
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    throw error;
  }
}

/**
 * Clean dummy code (production ready)
 */
export async function cleanDummy(options: SwitchOptions) {
  const spinner = Logger.spinner("Cleaning dummy code...");

  try {
    let filesToProcess: string[] = [];

    if (options.files && options.files.length > 0) {
      filesToProcess = options.files;
    } else if (options.directory) {
      const dir = path.resolve(process.cwd(), options.directory);
      filesToProcess = findTypeScriptFiles(dir, options.pattern);
    } else {
      throw new Error("Please specify --files or --directory");
    }

    if (filesToProcess.length === 0) {
      spinner.warn("No files found to process");
      return;
    }

    const { processed, errors } = processFiles(filesToProcess, "clean");

    if (errors.length > 0) {
      spinner.fail("Some files failed to process");
      errors.forEach((err) => Logger.error(err));
    } else {
      spinner.succeed(
        `Cleaned ${processed.length} file(s) - production ready!`
      );
    }

    processed.forEach((file) => Logger.file(file));
  } catch (error) {
    spinner.fail("Failed to clean dummy code");
    if (error instanceof Error) {
      Logger.error(error.message);
    }
    throw error;
  }
}
