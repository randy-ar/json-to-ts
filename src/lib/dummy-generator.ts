import { DummyGeneratorOptions } from './types';
import * as path from 'path';

/**
 * Generate relative import path from output file to types file
 */
function generateImportPath(fromFile: string, toFile: string): string {
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, toFile);

  // Remove .d.ts or .ts extension
  relativePath = relativePath.replace(/\.d\.ts$/, '').replace(/\.ts$/, '');

  // Ensure path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}

/**
 * Format JSON data as TypeScript code
 */
function formatJsonAsTypeScript(data: unknown, indent: number = 0): string {
  const indentation = '  '.repeat(indent);

  if (data === null) {
    return 'null';
  }

  if (data === undefined) {
    return 'undefined';
  }

  if (typeof data === 'string') {
    // Escape special characters
    const escaped = data
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `'${escaped}'`;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]';
    }

    const items = data.map((item) => formatJsonAsTypeScript(item, indent + 1));

    // Check if all items are primitives for inline formatting
    const allPrimitives = data.every(
      (item) =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        item === null
    );

    if (allPrimitives && items.join(', ').length < 80) {
      return `[${items.join(', ')}]`;
    }

    return `[\n${indentation}  ${items.join(`,\n${indentation}  `)},\n${indentation}]`;
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);

    if (entries.length === 0) {
      return '{}';
    }

    const properties = entries.map(([key, value]) => {
      const formattedValue = formatJsonAsTypeScript(value, indent + 1);
      // Use quotes for keys with special characters or spaces
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(key);
      const keyStr = needsQuotes ? `'${key}'` : key;
      return `${indentation}  ${keyStr}: ${formattedValue}`;
    });

    return `{\n${properties.join(',\n')},\n${indentation}}`;
  }

  return 'undefined';
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
    typeName,
    functionName,
    output,
    async: isAsync = true,
    wrapper = true,
  } = options;

  // Generate import paths
  const typesImportPath = output
    ? generateImportPath(output, types)
    : '@/types/api/generated';

  // Format the JSON data
  const formattedData = formatJsonAsTypeScript(jsonData, 0);

  // Build the file content
  const lines: string[] = [];

  // Header comment
  lines.push('/**');
  lines.push(` * Dummy data for ${typeName}`);
  lines.push(` * Generated from: ${path.basename(options.input)}`);
  lines.push(' * ');
  lines.push(' * This file is auto-generated. Do not edit manually.');
  lines.push(' */');
  lines.push('');

  // Imports
  lines.push(`import { ${typeName} } from '${typesImportPath}';`);
  if (wrapper) {
    lines.push(`import { BaseApiResponse } from '@/types/api/api-general';`);
  }
  lines.push('');

  // Dummy data constant
  lines.push(`const DUMMY_DATA: ${typeName} = ${formattedData};`);
  lines.push('');

  // Function
  if (isAsync) {
    if (wrapper) {
      lines.push('/**');
      lines.push(` * Get dummy ${typeName} data`);
      lines.push(' * @param id - Optional ID parameter');
      lines.push(
        ` * @returns Promise with BaseApiResponse containing ${typeName}`
      );
      lines.push(' */');
      lines.push(
        `export async function ${functionName}(id?: number): Promise<BaseApiResponse<${typeName}>> {`
      );
      lines.push('  return new Promise((resolve) => {');
      lines.push('    setTimeout(() => {');
      lines.push('      resolve({');
      lines.push('        code: 200,');
      lines.push("        status: 'success',");
      lines.push("        message: 'Data retrieved successfully',");
      lines.push('        data: DUMMY_DATA,');
      lines.push('      });');
      lines.push('    }, 500);');
      lines.push('  });');
      lines.push('}');
    } else {
      lines.push('/**');
      lines.push(` * Get dummy ${typeName} data`);
      lines.push(' * @param id - Optional ID parameter');
      lines.push(` * @returns Promise with ${typeName}`);
      lines.push(' */');
      lines.push(
        `export async function ${functionName}(id?: number): Promise<${typeName}> {`
      );
      lines.push('  return new Promise((resolve) => {');
      lines.push('    setTimeout(() => {');
      lines.push('      resolve(DUMMY_DATA);');
      lines.push('    }, 500);');
      lines.push('  });');
      lines.push('}');
    }
  } else {
    if (wrapper) {
      lines.push('/**');
      lines.push(` * Get dummy ${typeName} data`);
      lines.push(' * @param id - Optional ID parameter');
      lines.push(` * @returns BaseApiResponse containing ${typeName}`);
      lines.push(' */');
      lines.push(
        `export function ${functionName}(id?: number): BaseApiResponse<${typeName}> {`
      );
      lines.push('  return {');
      lines.push('    code: 200,');
      lines.push("    status: 'success',");
      lines.push("    message: 'Data retrieved successfully',");
      lines.push('    data: DUMMY_DATA,');
      lines.push('  };');
      lines.push('}');
    } else {
      lines.push('/**');
      lines.push(` * Get dummy ${typeName} data`);
      lines.push(' * @param id - Optional ID parameter');
      lines.push(` * @returns ${typeName}`);
      lines.push(' */');
      lines.push(`export function ${functionName}(id?: number): ${typeName} {`);
      lines.push('  return DUMMY_DATA;');
      lines.push('}');
    }
  }

  lines.push('');

  return lines.join('\n');
}
