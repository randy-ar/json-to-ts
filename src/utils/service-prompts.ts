import inquirer from "inquirer";
import autocompletePrompt from "inquirer-autocomplete-prompt";
import * as fs from "fs";
import * as path from "path";
import { ServiceMethod } from "../lib/service-types";

// Register autocomplete prompt
inquirer.registerPrompt("autocomplete", autocompletePrompt);

/**
 * Search for files matching the input pattern
 */
function searchFiles(input: string = "", extension?: string): string[] {
  const cwd = process.cwd();
  const inputPath = input || ".";

  let searchDir = cwd;
  let searchPattern = "";

  if (inputPath.endsWith("/")) {
    searchDir = path.resolve(cwd, inputPath);
    searchPattern = "";
  } else if (inputPath.includes("/")) {
    const parts = inputPath.split("/");
    searchPattern = parts.pop() || "";
    const dirPath = parts.join("/");
    searchDir = path.resolve(cwd, dirPath || ".");
  } else {
    searchPattern = inputPath;
  }

  if (!fs.existsSync(searchDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(searchDir);
    const results: string[] = [];

    for (const file of files) {
      if (file.startsWith(".") && file !== "..") continue;

      const fullPath = path.join(searchDir, file);
      const relativePath = path.relative(cwd, fullPath);

      try {
        const stat = fs.statSync(fullPath);
        const matches =
          !searchPattern ||
          file.toLowerCase().includes(searchPattern.toLowerCase());

        if (matches) {
          if (stat.isDirectory()) {
            results.push(relativePath + "/");
          } else if (!extension || file.endsWith(extension)) {
            results.push(relativePath);
          }
        }
      } catch (err) {
        continue;
      }
    }

    return results.sort((a, b) => {
      const aIsDir = a.endsWith("/");
      const bIsDir = b.endsWith("/");
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
  } catch (error) {
    return [];
  }
}

/**
 * Prompt for service generation - initial setup
 */
export async function promptServiceSetup() {
  return await inquirer.prompt([
    {
      type: "autocomplete",
      name: "outputPath",
      message: "Output service file path (type to create new):",
      source: async (_answersSoFar: any, input: string) => {
        const files = searchFiles(input, ".ts");
        // Allow user to type new path even if not in suggestions
        if (input && !files.includes(input)) {
          files.unshift(input);
        }
        return files;
      },
      validate: (input: any) => {
        const inputValue =
          typeof input === "string" ? input : input?.value || input;
        if (!inputValue || inputValue.length === 0) {
          return "Output path is required";
        }
        if (!inputValue.endsWith(".ts")) {
          return "Output file must be a TypeScript file (.ts)";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "mode",
      message: "Service file mode:",
      choices: [
        { name: "Create new service", value: "create" },
        { name: "Add methods to existing service", value: "update" },
      ],
      when: (answers: any) => {
        const resolvedPath = path.resolve(process.cwd(), answers.outputPath);
        return fs.existsSync(resolvedPath);
      },
      default: "create",
    },
    {
      type: "input",
      name: "basePath",
      message: "Base API endpoint path (e.g., /users, /products):",
      validate: (input: string) => {
        if (input.length === 0) {
          return "Base path is required";
        }
        if (!input.startsWith("/")) {
          return "Base path must start with /";
        }
        return true;
      },
      when: (answers: any) => answers.mode === "create" || !answers.mode,
    },
    {
      type: "input",
      name: "className",
      message: "Service class name (e.g., UserApiService):",
      validate: (input: string) => {
        if (input.length === 0) {
          return "Class name is required";
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
          return "Class name must be in PascalCase";
        }
        return true;
      },
      when: (answers: any) => answers.mode === "create" || !answers.mode,
    },
  ]);
}

/**
 * Context from previous method configuration
 */
interface MethodContext {
  lastInputJson?: string;
  lastOutputTypes?: string;
  lastTypeName?: string;
  lastOutputDummy?: string;
}

/**
 * Prompt for method configuration
 */
export async function promptMethodConfig(
  context: MethodContext = {}
): Promise<ServiceMethod & { _context?: MethodContext }> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Method name (e.g., getSingle, getAll, create):",
      validate: (input: string) => {
        if (input.length === 0) {
          return "Method name is required";
        }
        if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
          return "Method name must be in camelCase";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "httpMethod",
      message: "HTTP method:",
      choices: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET",
    },
    {
      type: "input",
      name: "endpoint",
      message: "Endpoint path (e.g., /{id}, /search, /bulk):",
      validate: (input: string) => {
        if (input.length === 0) {
          return "Endpoint path is required";
        }
        return true;
      },
    },
  ]);

  // Request body type (for POST/PUT/PATCH)
  if (["POST", "PUT", "PATCH"].includes(answers.httpMethod)) {
    const bodyConfig = await inquirer.prompt([
      {
        type: "list",
        name: "hasRequestBody",
        message: "Does this method have a request body?",
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
        default: true,
      },
      {
        type: "input",
        name: "requestBodyType",
        message: "Request body type name:",
        when: (ans: any) => ans.hasRequestBody,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Type name is required";
          }
          return true;
        },
      },
    ]);

    if (bodyConfig.requestBodyType) {
      answers.requestBodyType = bodyConfig.requestBodyType;
    }
  }

  // Response type configuration
  const responseConfig = await inquirer.prompt([
    {
      type: "list",
      name: "responseMode",
      message: "Response data configuration:",
      choices: [
        { name: "Use existing type", value: "existing" },
        { name: "Create new type from JSON", value: "new" },
        { name: "No specific type (unknown)", value: "none" },
      ],
    },
  ]);

  if (responseConfig.responseMode === "existing") {
    const existingType = await inquirer.prompt([
      {
        type: "input",
        name: "responseTypePath",
        message: "Types file path (import path):",
        default: context.lastOutputTypes,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Types file path is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "responseType",
        message: "Response type name:",
        default: context.lastTypeName,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Type name is required";
          }
          return true;
        },
      },
    ]);

    answers.responseType = existingType.responseType;
    answers.responseTypePath = existingType.responseTypePath;
  } else if (responseConfig.responseMode === "new") {
    const newType = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "inputJson",
        message: "Input JSON file path:",
        default: context.lastInputJson,
        source: async (_answersSoFar: any, input: string) => {
          return searchFiles(input || context.lastInputJson || "", ".json");
        },
        validate: (input: any) => {
          const inputValue =
            typeof input === "string" ? input : input?.value || input;
          if (!inputValue) return "Invalid input";
          const resolvedPath = path.resolve(process.cwd(), inputValue);
          if (!fs.existsSync(resolvedPath)) {
            return `File not found: ${resolvedPath}`;
          }
          return true;
        },
      },
      {
        type: "autocomplete",
        name: "outputTypes",
        message: "Output types file path (type to create new):",
        default: context.lastOutputTypes,
        source: async (_answersSoFar: any, input: string) => {
          const files = searchFiles(
            input || context.lastOutputTypes || "",
            ".ts"
          );
          // Allow user to type new path
          if (input && !files.includes(input)) {
            files.unshift(input);
          }
          return files;
        },
        validate: (input: any) => {
          const inputValue =
            typeof input === "string" ? input : input?.value || input;
          if (!inputValue || inputValue.length === 0) {
            return "Output path is required";
          }
          if (!inputValue.endsWith(".ts") && !inputValue.endsWith(".d.ts")) {
            return "Output file must be a TypeScript file";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "responseType",
        message: "Type name:",
        default: context.lastTypeName,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Type name is required";
          }
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return "Type name must be in PascalCase";
          }
          return true;
        },
      },
    ]);

    answers.responseType = newType.responseType;
    answers.responseTypePath = newType.outputTypes;
    answers._newTypeConfig = newType;

    // Update context for next method
    context.lastInputJson = newType.inputJson;
    context.lastOutputTypes = newType.outputTypes;
    context.lastTypeName = newType.responseType;
  } else {
    answers.responseType = "unknown";
  }

  // Dummy data configuration
  const dummyConfig = await inquirer.prompt([
    {
      type: "list",
      name: "dummyMode",
      message: "Dummy data configuration:",
      choices: [
        { name: "Skip (no dummy data)", value: "skip" },
        { name: "Use existing dummy function", value: "existing" },
        { name: "Generate new dummy data", value: "new" },
      ],
      default: "skip",
    },
  ]);

  if (dummyConfig.dummyMode === "existing") {
    const existingDummy = await inquirer.prompt([
      {
        type: "input",
        name: "dummyFunctionPath",
        message: "Dummy file path (import path):",
        default: context.lastOutputDummy,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Dummy file path is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "dummyFunction",
        message: "Dummy function name:",
        validate: (input: string) => {
          if (input.length === 0) {
            return "Function name is required";
          }
          return true;
        },
      },
    ]);

    answers.dummyFunction = existingDummy.dummyFunction;
    answers.dummyFunctionPath = existingDummy.dummyFunctionPath;
  } else if (dummyConfig.dummyMode === "new") {
    const newDummy = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "inputJson",
        message: "Input JSON file path:",
        default: context.lastInputJson,
        source: async (_answersSoFar: any, input: string) => {
          return searchFiles(input || context.lastInputJson || "", ".json");
        },
        validate: (input: any) => {
          const inputValue =
            typeof input === "string" ? input : input?.value || input;
          if (!inputValue) return "Invalid input";
          const resolvedPath = path.resolve(process.cwd(), inputValue);
          if (!fs.existsSync(resolvedPath)) {
            return `File not found: ${resolvedPath}`;
          }
          return true;
        },
      },
      {
        type: "autocomplete",
        name: "outputDummy",
        message: "Output dummy file path (type to create new):",
        default: context.lastOutputDummy,
        source: async (_answersSoFar: any, input: string) => {
          const files = searchFiles(
            input || context.lastOutputDummy || "",
            ".ts"
          );
          // Allow user to type new path
          if (input && !files.includes(input)) {
            files.unshift(input);
          }
          return files;
        },
        validate: (input: any) => {
          const inputValue =
            typeof input === "string" ? input : input?.value || input;
          if (!inputValue || inputValue.length === 0) {
            return "Output path is required";
          }
          if (!inputValue.endsWith(".ts")) {
            return "Output file must be a TypeScript file";
          }
          return true;
        },
      },
      {
        type: "autocomplete",
        name: "typesFile",
        message: "Types file path:",
        default: context.lastOutputTypes,
        source: async (_answersSoFar: any, input: string) => {
          return searchFiles(input || context.lastOutputTypes || "", ".ts");
        },
        validate: (input: any) => {
          const inputValue =
            typeof input === "string" ? input : input?.value || input;
          if (!inputValue) return "Types file path is required";
          return true;
        },
      },
      {
        type: "input",
        name: "typeName",
        message: "Type name:",
        default: context.lastTypeName,
        validate: (input: string) => {
          if (input.length === 0) {
            return "Type name is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "dummyFunction",
        message: "Dummy function name:",
        validate: (input: string) => {
          if (input.length === 0) {
            return "Function name is required";
          }
          return true;
        },
      },
    ]);

    answers.dummyFunction = newDummy.dummyFunction;
    answers.dummyFunctionPath = newDummy.outputDummy;
    answers._newDummyConfig = newDummy;

    // Update context for next method
    context.lastOutputDummy = newDummy.outputDummy;
  }

  // Attach context to return value
  (answers as any)._context = context;

  return answers as ServiceMethod & { _context?: MethodContext };
}

/**
 * Prompt to add another method
 */
export async function promptAddAnotherMethod(): Promise<boolean> {
  const { addAnother } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addAnother",
      message: "Add another method?",
      default: true,
    },
  ]);

  return addAnother;
}
