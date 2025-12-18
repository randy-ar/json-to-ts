#!/usr/bin/env node

import { Command } from "commander";
import { runInteractive } from "./commands/interactive.js";
import { generateTypes } from "./commands/types.js";
import { generateDummy } from "./commands/dummy.js";
import { useDummy, useLive, cleanDummy } from "./commands/switch.js";
import { generateService } from "./commands/service.js";

const program = new Command();

program
  .name("json-to-ts")
  .description("Convert JSON to TypeScript types and dummy data")
  .version("1.0.0");

// Interactive mode (default when no command specified)
program
  .command("interactive")
  .description("Run in interactive mode")
  .action(runInteractive);

// Types command
program
  .command("types")
  .description("Generate TypeScript types from JSON")
  .option("-i, --input <path>", "Input JSON file")
  .option("-o, --output <path>", "Output TypeScript file")
  .option("-n, --name <name>", "Type name")
  .option("--optional", "Mark all fields as optional")
  .action(generateTypes);

// Dummy command
program
  .command("dummy")
  .description("Generate dummy data from JSON")
  .option("-i, --input <path>", "Input JSON file")
  .option("-t, --types <path>", "Types file")
  .option("-n, --type-name <name>", "Type name")
  .option("-f, --function-name <name>", "Function name")
  .option("-o, --output <path>", "Output file")
  .option("-c, --count <number>", "Number of data items to generate")
  .option("--no-async", "Generate synchronous function")
  .option("--no-wrapper", "Don't wrap in BaseApiResponse")
  .action(generateDummy);

// Service command
program
  .command("service")
  .description("Generate API service file with methods")
  .action(generateService);

// Code switching commands
program
  .command("use-dummy")
  .description("Switch service files to use dummy implementation")
  .option("-f, --files <paths...>", "Specific files to process")
  .option("-d, --directory <path>", "Directory to scan for files")
  .option("-p, --pattern <pattern>", "File name pattern to match")
  .action(useDummy);

program
  .command("use-live")
  .description("Switch service files to use live API implementation")
  .option("-f, --files <paths...>", "Specific files to process")
  .option("-d, --directory <path>", "Directory to scan for files")
  .option("-p, --pattern <pattern>", "File name pattern to match")
  .action(useLive);

program
  .command("clean-dummy")
  .description("Remove all dummy code blocks (production ready)")
  .option("-f, --files <paths...>", "Specific files to process")
  .option("-d, --directory <path>", "Directory to scan for files")
  .option("-p, --pattern <pattern>", "File name pattern to match")
  .action(cleanDummy);

// If no command specified, run interactive mode
if (process.argv.length === 2) {
  runInteractive();
} else {
  program.parse();
}
