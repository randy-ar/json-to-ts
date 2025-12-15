import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";

export async function promptMode() {
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What would you like to do?",
      choices: [
        { name: "📝 Generate TypeScript Types", value: "types" },
        { name: "🎲 Generate Dummy Data", value: "dummy" },
        { name: "✨ Both (Types + Dummy)", value: "both" },
      ],
    },
  ]);
  return mode;
}

export async function promptTypeGeneration() {
  return await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message: "Input JSON file path:",
      validate: (input) => {
        const resolvedPath = path.resolve(process.cwd(), input);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        if (!input.endsWith(".json")) {
          return "File must be a JSON file (.json)";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "name",
      message: "Type name (PascalCase):",
      validate: (input) => {
        if (input.length === 0) {
          return "Type name is required";
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
          return "Type name must be in PascalCase (e.g., MyType, UserData)";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "outputMode",
      message: "Output location:",
      choices: [
        { name: "Same directory as input", value: "same" },
        { name: "Custom path", value: "custom" },
        { name: "Print to console", value: "console" },
      ],
    },
    {
      type: "input",
      name: "output",
      message: "Output file path:",
      when: (answers) => answers.outputMode === "custom",
      validate: (input) => {
        if (input.length === 0) {
          return "Output path is required";
        }
        if (!input.endsWith(".ts") && !input.endsWith(".d.ts")) {
          return "Output file must be a TypeScript file (.ts or .d.ts)";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "optional",
      message: "Mark all fields as optional?",
      default: false,
    },
  ]);
}

export async function promptDummyGeneration() {
  return await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message: "Input JSON file path:",
      validate: (input) => {
        const resolvedPath = path.resolve(process.cwd(), input);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "types",
      message: "TypeScript types file path:",
      validate: (input) => {
        const resolvedPath = path.resolve(process.cwd(), input);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "typeName",
      message: "Type name to use:",
      validate: (input) => input.length > 0 || "Type name is required",
    },
    {
      type: "input",
      name: "functionName",
      message: "Dummy function name (camelCase):",
      validate: (input) => {
        if (input.length === 0) {
          return "Function name is required";
        }
        if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
          return "Function name must be in camelCase (e.g., getDummyData)";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "outputMode",
      message: "Output location:",
      choices: [
        { name: "Same directory as input", value: "same" },
        { name: "Custom path", value: "custom" },
        { name: "Print to console", value: "console" },
      ],
    },
    {
      type: "input",
      name: "output",
      message: "Output file path:",
      when: (answers) => answers.outputMode === "custom",
      validate: (input) => {
        if (input.length === 0) {
          return "Output path is required";
        }
        if (!input.endsWith(".ts")) {
          return "Output file must be a TypeScript file (.ts)";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "async",
      message: "Generate async function?",
      default: true,
    },
    {
      type: "confirm",
      name: "wrapper",
      message: "Wrap in BaseApiResponse?",
      default: true,
    },
  ]);
}
