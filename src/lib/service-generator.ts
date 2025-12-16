import * as fs from "fs";
import * as path from "path";
import { ServiceConfig, ServiceMethod } from "./service-types";

/**
 * Generate import statements
 */
function generateImports(config: ServiceConfig): string[] {
  const imports: string[] = [];
  const importMap = new Map<string, Set<string>>();

  // Base imports
  imports.push("import axios from 'axios';");
  imports.push("import { BaseApiService } from '@/services/api/base';");
  imports.push("import { BaseApiResponse } from '@/types/api/api-general';");
  imports.push("import { httpClient } from '@/services/http/client';");

  // Collect type imports
  for (const method of config.methods) {
    if (method.responseTypePath) {
      const typePath = method.responseTypePath;
      if (!importMap.has(typePath)) {
        importMap.set(typePath, new Set());
      }
      importMap.get(typePath)!.add(method.responseType);
    }

    if (method.requestBodyType && method.responseTypePath) {
      importMap.get(method.responseTypePath)!.add(method.requestBodyType);
    }
  }

  // Generate type imports
  for (const [typePath, types] of importMap.entries()) {
    const typesList = Array.from(types).join(", ");
    imports.push(`import { ${typesList} } from '${typePath}';`);
  }

  // Collect dummy imports
  const dummyImportMap = new Map<string, Set<string>>();
  for (const method of config.methods) {
    if (method.dummyFunction && method.dummyFunctionPath) {
      const dummyPath = method.dummyFunctionPath;
      if (!dummyImportMap.has(dummyPath)) {
        dummyImportMap.set(dummyPath, new Set());
      }
      dummyImportMap.get(dummyPath)!.add(method.dummyFunction);
    }
  }

  // Generate dummy imports with markers
  if (dummyImportMap.size > 0) {
    imports.push("// DUMMY_START");
    for (const [dummyPath, functions] of dummyImportMap.entries()) {
      const functionsList = Array.from(functions).join(", ");
      imports.push(`import { ${functionsList} } from '${dummyPath}';`);
    }
    imports.push("// DUMMY_END");
  }

  return imports;
}

/**
 * Generate method implementation
 */
function generateMethod(method: ServiceMethod, basePath: string): string {
  const lines: string[] = [];
  const {
    name,
    httpMethod,
    endpoint,
    requestBodyType,
    responseType,
    dummyFunction,
  } = method;

  // Determine return type
  const returnType = `BaseApiResponse<${responseType}>`;
  const hasRequestBody =
    requestBodyType &&
    (httpMethod === "POST" || httpMethod === "PUT" || httpMethod === "PATCH");

  // Method signature
  const params: string[] = [];

  // Add ID param for endpoints with {id}
  if (endpoint.includes("{id}")) {
    params.push("id: number");
  }

  // Add request body param
  if (hasRequestBody) {
    params.push(`data: ${requestBodyType}`);
  }

  const paramsStr = params.length > 0 ? params.join(", ") : "";
  lines.push(
    `  async ${name}(${paramsStr}): Promise<${returnType} | undefined> {`
  );

  // Dummy block
  if (dummyFunction) {
    lines.push("    // DUMMY_START");
    const dummyParams = endpoint.includes("{id}") ? "id" : "";
    lines.push(`    return await ${dummyFunction}(${dummyParams});`);
    lines.push("    // DUMMY_END");
    lines.push("");
  }

  // Live block
  lines.push("    // LIVE_START");
  if (!dummyFunction) {
    // No dummy, so don't comment live code
    lines.push("    try {");
  } else {
    lines.push("    // try {");
  }

  // Build endpoint path
  let endpointPath = endpoint;
  if (endpoint.startsWith("/")) {
    endpointPath = `\`\${this.basePath}${endpoint}\``;
  } else {
    endpointPath = `\`\${this.basePath}/${endpoint}\``;
  }

  // Replace {id} with ${id}
  endpointPath = endpointPath.replace("{id}", "${id}");

  const indent = dummyFunction ? "    //   " : "      ";
  lines.push(`${indent}const path = ${endpointPath};`);

  // HTTP client call
  if (httpMethod === "GET") {
    lines.push(`${indent}return await httpClient<${returnType}>(path);`);
  } else {
    lines.push(`${indent}return await httpClient<${returnType}>(path, {`);
    lines.push(`${indent}  method: '${httpMethod}',`);
    if (hasRequestBody) {
      lines.push(`${indent}  data,`);
    }
    lines.push(`${indent}});`);
  }

  // Error handling
  if (dummyFunction) {
    lines.push("    // } catch (error) {");
    lines.push(`    //   if (axios.isAxiosError<${returnType}>(error)) {`);
    lines.push("    //     return error.response?.data;");
    lines.push("    //   }");
    lines.push("    //   return undefined;");
    lines.push("    // }");
  } else {
    lines.push("    } catch (error) {");
    lines.push(`      if (axios.isAxiosError<${returnType}>(error)) {`);
    lines.push("        return error.response?.data;");
    lines.push("      }");
    lines.push("      return undefined;");
    lines.push("    }");
  }

  lines.push("    // LIVE_END");
  lines.push("  }");

  return lines.join("\n");
}

/**
 * Generate service class
 */
export function generateServiceClass(config: ServiceConfig): string {
  const lines: string[] = [];

  // Imports
  const imports = generateImports(config);
  lines.push(...imports);
  lines.push("");

  // Class definition
  lines.push(
    `export class ${config.className} extends BaseApiService<any, null, null> {`
  );
  lines.push("  constructor(basePath: string) {");
  lines.push("    super(basePath);");
  lines.push("  }");
  lines.push("");

  // Methods
  for (let i = 0; i < config.methods.length; i++) {
    const method = config.methods[i];
    lines.push(generateMethod(method, config.basePath));

    if (i < config.methods.length - 1) {
      lines.push("");
    }
  }

  lines.push("}");
  lines.push("");

  // Export instance
  const instanceName =
    config.className.replace(/Service$/, "").replace(/Api$/, "") + "Api";
  lines.push(
    `export const ${instanceName} = new ${config.className}('${config.basePath}');`
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate or update service file
 */
export function generateServiceFile(config: ServiceConfig): void {
  const outputDir = path.dirname(config.outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (config.mode === "create" || !fs.existsSync(config.outputPath)) {
    // Create new file
    const content = generateServiceClass(config);
    fs.writeFileSync(config.outputPath, content, "utf-8");
  } else {
    // Update existing file - append methods
    // For now, we'll just regenerate the whole file
    // TODO: Implement smart merging
    const content = generateServiceClass(config);
    fs.writeFileSync(config.outputPath, content, "utf-8");
  }
}
