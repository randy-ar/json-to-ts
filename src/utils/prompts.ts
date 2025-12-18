import inquirer from "inquirer";
import autocompletePrompt from "inquirer-autocomplete-prompt";
import * as fs from "fs";
import * as path from "path";

// Register autocomplete prompt
inquirer.registerPrompt("autocomplete", autocompletePrompt);

/**
 * Search for files matching the input pattern
 * Supports folder navigation: type "folder/" to see files inside
 */
function searchFiles(input: string = "", extension?: string): string[] {
  const cwd = process.cwd();
  const inputPath = input || ".";

  // Resolve the directory to search
  let searchDir = cwd;
  let searchPattern = "";

  // Check if input ends with / (user wants to navigate into folder)
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

  // If directory doesn't exist, return empty
  if (!fs.existsSync(searchDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(searchDir);
    const results: string[] = [];

    for (const file of files) {
      // Skip hidden files and common ignore patterns
      if (file.startsWith(".") && file !== "..") continue;

      const fullPath = path.join(searchDir, file);
      const relativePath = path.relative(cwd, fullPath);

      try {
        const stat = fs.statSync(fullPath);

        // Match pattern
        const matches =
          !searchPattern ||
          file.toLowerCase().includes(searchPattern.toLowerCase());

        if (matches) {
          if (stat.isDirectory()) {
            // Show folders with / suffix for navigation
            results.push(relativePath + "/");
          } else if (!extension || file.endsWith(extension)) {
            // Only show files with matching extension
            results.push(relativePath);
          }
        }
      } catch (err) {
        // Skip files that can't be accessed
        continue;
      }
    }

    // Sort: folders first, then files
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

export async function promptMode() {
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What would you like to do?",
      choices: [
        { name: "📝 Generate TypeScript Types", value: "types" },
        { name: "🎲 Generate Dummy Data", value: "dummy" },
        { name: "🔧 Generate API Service", value: "service" },
        { name: "✨ Both (Types + Dummy)", value: "both" },
      ],
    },
  ]);
  return mode;
}

export async function promptTypeGeneration() {
  return await inquirer.prompt([
    {
      type: "autocomplete",
      name: "input",
      message: "Input JSON file path:",
      source: async (_answersSoFar: any, input: string) => {
        return searchFiles(input, ".json");
      },
      validate: (input: any) => {
        // Extract string value from input (could be string or Choice object)
        const inputValue =
          typeof input === "string" ? input : input?.value || input;
        if (!inputValue || typeof inputValue !== "string") {
          return "Invalid input";
        }
        const resolvedPath = path.resolve(process.cwd(), inputValue);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        if (!inputValue.endsWith(".json")) {
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
      type: "autocomplete",
      name: "input",
      message: "Input JSON file path:",
      source: async (_answersSoFar: any, input: string) => {
        return searchFiles(input, ".json");
      },
      validate: (input: any) => {
        // Extract string value from input (could be string or Choice object)
        const inputValue =
          typeof input === "string" ? input : input?.value || input;
        if (!inputValue || typeof inputValue !== "string") {
          return "Invalid input";
        }
        const resolvedPath = path.resolve(process.cwd(), inputValue);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        return true;
      },
    },
    {
      type: "autocomplete",
      name: "types",
      message: "TypeScript types file path:",
      source: async (_answersSoFar: any, input: string) => {
        return searchFiles(input, ".ts");
      },
      validate: (input: any) => {
        // Extract string value from input (could be string or Choice object)
        const inputValue =
          typeof input === "string" ? input : input?.value || input;
        if (!inputValue || typeof inputValue !== "string") {
          return "Invalid input";
        }
        const resolvedPath = path.resolve(process.cwd(), inputValue);
        if (!fs.existsSync(resolvedPath)) {
          return `File not found: ${resolvedPath}`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "typeName",
      message: "Type name to use (e.g., User or User[]):",
      validate: (input: string) => {
        if (input.length === 0) {
          return "Type name is required";
        }
        // Allow PascalCase with optional [] suffix
        if (!/^[A-Z][a-zA-Z0-9]*(\[\])?$/.test(input)) {
          return "Type name must be in PascalCase (e.g., User, UserData) with optional [] for arrays";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "functionName",
      message: "Dummy function name (camelCase):",
      validate: (input: string) => {
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
      type: "number",
      name: "count",
      message: "Berapa banyak data yang ingin di-generate?",
      default: 1,
      when: (answers: any) => answers.typeName.endsWith("[]"),
      validate: (value: number) => {
        if (!value || value < 1) {
          return "Minimal data adalah 1";
        }
        if (!Number.isInteger(value)) {
          return "Jumlah data harus berupa bilangan bulat";
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
      when: (answers: any) => answers.outputMode === "custom",
      validate: (input: string) => {
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
