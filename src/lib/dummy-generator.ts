import { DummyGeneratorOptions, ParsedTypeName, NestedTypeInfo } from "./types";
import * as path from "path";
import * as fs from "fs";

/**
 * Parse type name to extract base name and array flag
 * Examples: "User" -> {baseName: "User", isArray: false}
 *          "User[]" -> {baseName: "User", isArray: true}
 */
function parseTypeName(typeName: string): ParsedTypeName {
  const arrayMatch = typeName.match(/^([A-Z][a-zA-Z0-9]*)\[\]$/);
  if (arrayMatch) {
    return {
      baseName: arrayMatch[1],
      isArray: true,
    };
  }
  return {
    baseName: typeName,
    isArray: false,
  };
}

/**
 * Parse TypeScript type definitions to extract nested types
 * This uses regex-based parsing for simplicity
 */
function parseTypeDefinitions(
  typesFilePath: string,
  mainTypeName: string
): Map<string, NestedTypeInfo> {
  const content = fs.readFileSync(typesFilePath, "utf-8");
  const typeMap = new Map<string, NestedTypeInfo>();

  // Regex to match interface/type definitions
  const interfaceRegex =
    /export\s+(?:interface|type)\s+([A-Z][a-zA-Z0-9]*)\s*(?:=\s*)?\{([^}]+)\}/g;

  let match;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const typeName = match[1];
    const body = match[2];

    const properties: Record<string, string> = {};
    const dependencies: string[] = [];

    // Parse properties - handle both simple and complex types
    const propertyRegex = /(\w+)\??\s*:\s*([^;,\n]+)/g;
    let propMatch;

    while ((propMatch = propertyRegex.exec(body)) !== null) {
      const propName = propMatch[1];
      let propType = propMatch[2].trim();

      // Remove array notation for dependency checking
      const baseType = propType.replace(/\[\]$/, "");

      // Check if this is a reference to another custom type (PascalCase)
      if (/^[A-Z][a-zA-Z0-9]*$/.test(baseType)) {
        dependencies.push(baseType);
      }

      properties[propName] = propType;
    }

    typeMap.set(typeName, {
      typeName,
      properties,
      dependencies,
    });
  }

  return typeMap;
}

/**
 * Sort types by dependencies (leaf types first)
 */
function sortTypesByDependencies(
  typeMap: Map<string, NestedTypeInfo>,
  mainTypeName: string
): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();

  function visit(typeName: string) {
    if (visited.has(typeName)) return;
    visited.add(typeName);

    const typeInfo = typeMap.get(typeName);
    if (!typeInfo) return;

    // Visit dependencies first
    for (const dep of typeInfo.dependencies) {
      if (typeMap.has(dep)) {
        visit(dep);
      }
    }

    sorted.push(typeName);
  }

  visit(mainTypeName);
  return sorted;
}

/**
 * Generate variable name from type name
 * Example: "User" -> "dummyUser", "UserLocation" -> "dummyUserLocation"
 */
function generateVariableName(typeName: string): string {
  return "dummy" + typeName;
}

/**
 * Generate relative import path from output file to types file
 */
function generateImportPath(fromFile: string, toFile: string): string {
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, toFile);

  // Remove .d.ts or .ts extension
  relativePath = relativePath.replace(/\.d\.ts$/, "").replace(/\.ts$/, "");

  // Ensure path starts with ./ or ../
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  return relativePath;
}

/**
 * Split JSON data into separate dummy constants for nested types
 */
function splitDummyDataByTypes(
  jsonData: unknown,
  typeMap: Map<string, NestedTypeInfo>,
  sortedTypes: string[]
): Map<string, unknown> {
  const dummyDataMap = new Map<string, unknown>();

  // Helper to extract data for a specific type with proper references
  function extractDataForType(data: unknown, typeName: string): unknown {
    const typeInfo = typeMap.get(typeName);
    if (!typeInfo || typeof data !== "object" || data === null) {
      return data;
    }

    const result: Record<string, unknown> = {};
    const dataObj = data as Record<string, unknown>;

    for (const [propName, propType] of Object.entries(typeInfo.properties)) {
      const value = dataObj[propName];

      // Check if this property is a reference to another type
      const baseType = propType.replace(/\[\]$/, "");
      const isArray = propType.endsWith("[]");

      if (typeMap.has(baseType)) {
        // This is a nested type - just reference the variable name
        const varName = generateVariableName(baseType);
        if (isArray && Array.isArray(value)) {
          result[propName] = `__REF__${varName}__ARRAY__`;
        } else {
          result[propName] = `__REF__${varName}__`;
        }
      } else {
        result[propName] = value;
      }
    }

    return result;
  }

  // Process types in dependency order
  for (const typeName of sortedTypes) {
    const typeInfo = typeMap.get(typeName);
    if (!typeInfo) continue;

    // For the main type, use the full JSON data
    // For nested types, extract from the parent
    let typeData: unknown;

    if (typeName === sortedTypes[sortedTypes.length - 1]) {
      // Main type
      typeData = extractDataForType(jsonData, typeName);
    } else {
      // Nested type - find it in the JSON data and apply references
      const rawData = findNestedData(jsonData, typeName, typeMap);
      typeData = extractDataForType(rawData, typeName);
    }

    dummyDataMap.set(typeName, typeData);
  }

  return dummyDataMap;
}

/**
 * Find nested data in JSON for a specific type
 */
function findNestedData(
  data: unknown,
  targetTypeName: string,
  typeMap: Map<string, NestedTypeInfo>
): unknown {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const dataObj = data as Record<string, unknown>;

  // Look through all properties to find one that matches the target type
  for (const [key, value] of Object.entries(dataObj)) {
    // Check if any type has this property with the target type
    for (const [typeName, typeInfo] of typeMap.entries()) {
      for (const [propName, propType] of Object.entries(typeInfo.properties)) {
        const baseType = propType.replace(/\[\]$/, "");
        if (baseType === targetTypeName && propName === key) {
          // Found it! Extract the data
          if (Array.isArray(value) && value.length > 0) {
            return extractTypeData(value[0], targetTypeName, typeMap);
          } else if (typeof value === "object" && value !== null) {
            return extractTypeData(value, targetTypeName, typeMap);
          }
        }
      }
    }

    // Recursively search nested objects
    if (typeof value === "object" && value !== null) {
      const found = findNestedData(value, targetTypeName, typeMap);
      if (found && Object.keys(found as object).length > 0) {
        return found;
      }
    }
  }

  return {};
}

/**
 * Extract data matching a specific type structure
 */
function extractTypeData(
  data: unknown,
  typeName: string,
  typeMap: Map<string, NestedTypeInfo>
): unknown {
  const typeInfo = typeMap.get(typeName);
  if (!typeInfo || typeof data !== "object" || data === null) {
    return data;
  }

  const result: Record<string, unknown> = {};
  const dataObj = data as Record<string, unknown>;

  for (const propName of Object.keys(typeInfo.properties)) {
    if (propName in dataObj) {
      result[propName] = dataObj[propName];
    }
  }

  return result;
}

/**
 * Format JSON data as TypeScript code with type casting for nested objects
 */
function formatJsonAsTypeScriptWithCasting(
  data: unknown,
  typeMap: Map<string, NestedTypeInfo>,
  currentTypeName: string,
  indent: number = 0
): string {
  const indentation = "  ".repeat(indent);

  if (data === null) {
    return "null";
  }

  if (data === undefined) {
    return "undefined";
  }

  if (typeof data === "string") {
    // Escape special characters
    const escaped = data
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `'${escaped}'`;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return "[]";
    }

    const items = data.map((item) =>
      formatJsonAsTypeScriptWithCasting(
        item,
        typeMap,
        currentTypeName,
        indent + 1
      )
    );

    // Check if all items are primitives for inline formatting
    const allPrimitives = data.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean" ||
        item === null
    );

    if (allPrimitives && items.join(", ").length < 80) {
      return `[${items.join(", ")}]`;
    }

    return `[\n${indentation}  ${items.join(
      `,\n${indentation}  `
    )},\n${indentation}]`;
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);

    if (entries.length === 0) {
      return "{}";
    }

    const typeInfo = typeMap.get(currentTypeName);
    const properties = entries.map(([key, value]) => {
      // Check if this property should have type casting
      let typeCast = "";
      if (typeInfo && typeInfo.properties[key]) {
        const propType = typeInfo.properties[key];
        const baseType = propType.replace(/\[\]$/, "");

        // Only add type cast if it's a custom type (not primitive)
        if (
          typeMap.has(baseType) &&
          typeof value === "object" &&
          value !== null
        ) {
          typeCast = ` as ${propType}`;
        }
      }

      const formattedValue = formatJsonAsTypeScriptWithCasting(
        value,
        typeMap,
        typeInfo?.properties[key]?.replace(/\[\]$/, "") || "",
        indent + 1
      );

      // Use quotes for keys with special characters or spaces
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(key);
      const keyStr = needsQuotes ? `'${key}'` : key;
      return `${indentation}  ${keyStr}: ${formattedValue}${typeCast}`;
    });

    return `{\n${properties.join(",\n")},\n${indentation}}`;
  }

  return "undefined";
}

/**
 * Format JSON data as TypeScript code (legacy - for backward compatibility)
 */
function formatJsonAsTypeScript(data: unknown, indent: number = 0): string {
  const indentation = "  ".repeat(indent);

  if (data === null) {
    return "null";
  }

  if (data === undefined) {
    return "undefined";
  }

  if (typeof data === "string") {
    // Check for reference placeholders
    if (data.startsWith("__REF__") && data.endsWith("__")) {
      const refMatch = data.match(/^__REF__(.+?)__(?:ARRAY__)?$/);
      if (refMatch) {
        const varName = refMatch[1];
        const isArray = data.endsWith("__ARRAY__");
        return isArray ? `[${varName}]` : varName;
      }
    }

    // Escape special characters
    const escaped = data
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `'${escaped}'`;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return "[]";
    }

    const items = data.map((item) => formatJsonAsTypeScript(item, indent + 1));

    // Check if all items are primitives for inline formatting
    const allPrimitives = data.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean" ||
        item === null
    );

    if (allPrimitives && items.join(", ").length < 80) {
      return `[${items.join(", ")}]`;
    }

    return `[\n${indentation}  ${items.join(
      `,\n${indentation}  `
    )},\n${indentation}]`;
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);

    if (entries.length === 0) {
      return "{}";
    }

    const properties = entries.map(([key, value]) => {
      const formattedValue = formatJsonAsTypeScript(value, indent + 1);
      // Use quotes for keys with special characters or spaces
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(key);
      const keyStr = needsQuotes ? `'${key}'` : key;
      return `${indentation}  ${keyStr}: ${formattedValue}`;
    });

    return `{\n${properties.join(",\n")},\n${indentation}}`;
  }

  return "undefined";
}

/**
 * Generate dummy data TypeScript file
 */
export function generateDummyData(
  jsonData: unknown,
  options: DummyGeneratorOptions
): string {
  const {
    types,
    typeName: rawTypeName,
    functionName,
    output,
    async: isAsync = true,
    wrapper = true,
  } = options;

  // Parse type name for array notation
  const parsedType = parseTypeName(rawTypeName);
  const { baseName: typeName, isArray: isArrayType } = parsedType;

  // Parse type definitions from the types file
  const typeMap = parseTypeDefinitions(types, typeName);

  // Sort types by dependencies (leaf types first)
  const sortedTypes = sortTypesByDependencies(typeMap, typeName);

  // Split dummy data by types
  const dummyDataMap = splitDummyDataByTypes(jsonData, typeMap, sortedTypes);

  // Generate import paths
  const typesImportPath = output
    ? generateImportPath(output, types)
    : "@/types/api/generated";

  // Build the file content
  const lines: string[] = [];

  // Header comment
  lines.push("/**");
  lines.push(` * Dummy data for ${rawTypeName}`);
  lines.push(` * Generated from: ${path.basename(options.input)}`);
  lines.push(" * ");
  lines.push(" * This file is auto-generated. Do not edit manually.");
  lines.push(" */");
  lines.push("");

  // Collect all type names to import
  const typeNamesToImport = new Set<string>();
  for (const type of sortedTypes) {
    typeNamesToImport.add(type);
  }

  // Imports
  if (typeNamesToImport.size > 0) {
    const typesList = Array.from(typeNamesToImport).join(", ");
    lines.push(`import { ${typesList} } from '${typesImportPath}';`);
  }
  if (wrapper) {
    lines.push(`import { BaseApiResponse } from '@/types/api/api-general';`);
  }
  lines.push("");

  // Generate single dummy data constant with inline objects and type casting
  const formattedData = formatJsonAsTypeScriptWithCasting(
    jsonData,
    typeMap,
    typeName,
    0
  );
  const varName = generateVariableName(typeName);
  lines.push(`const ${varName}: ${typeName} = ${formattedData};`);
  lines.push("");

  // Generate the main function
  const mainVarName = generateVariableName(typeName);
  const returnType = isArrayType ? `${typeName}[]` : typeName;
  const returnValue = isArrayType ? `[${mainVarName}]` : mainVarName;

  if (isAsync) {
    if (wrapper) {
      lines.push("/**");
      lines.push(` * Get dummy ${rawTypeName} data`);
      lines.push(
        ` * @returns Promise with BaseApiResponse containing ${returnType}`
      );
      lines.push(" */");
      lines.push(
        `export async function ${functionName}(): Promise<BaseApiResponse<${returnType}>> {`
      );
      lines.push("  return new Promise((resolve) => {");
      lines.push("    setTimeout(() => {");
      lines.push("      resolve({");
      lines.push("        code: 200,");
      lines.push("        status: 'success',");
      lines.push("        message: 'Data retrieved successfully',");
      lines.push(`        data: ${returnValue},`);
      lines.push("      });");
      lines.push("    }, 500);");
      lines.push("  });");
      lines.push("}");
    } else {
      lines.push("/**");
      lines.push(` * Get dummy ${rawTypeName} data`);
      lines.push(` * @returns Promise with ${returnType}`);
      lines.push(" */");
      lines.push(
        `export async function ${functionName}(): Promise<${returnType}> {`
      );
      lines.push("  return new Promise((resolve) => {");
      lines.push("    setTimeout(() => {");
      lines.push(`      resolve(${returnValue});`);
      lines.push("    }, 500);");
      lines.push("  });");
      lines.push("}");
    }
  } else {
    if (wrapper) {
      lines.push("/**");
      lines.push(` * Get dummy ${rawTypeName} data`);
      lines.push(` * @returns BaseApiResponse containing ${returnType}`);
      lines.push(" */");
      lines.push(
        `export function ${functionName}(): BaseApiResponse<${returnType}> {`
      );
      lines.push("  return {");
      lines.push("    code: 200,");
      lines.push("    status: 'success',");
      lines.push("    message: 'Data retrieved successfully',");
      lines.push(`    data: ${returnValue},`);
      lines.push("  };");
      lines.push("}");
    } else {
      lines.push("/**");
      lines.push(` * Get dummy ${rawTypeName} data`);
      lines.push(` * @returns ${returnType}`);
      lines.push(" */");
      lines.push(`export function ${functionName}(): ${returnType} {`);
      lines.push(`  return ${returnValue};`);
      lines.push("}");
    }
  }

  lines.push("");

  return lines.join("\n");
}
