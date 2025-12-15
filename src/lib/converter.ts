import { TypeInfo } from './types';

/**
 * Analyze JSON value and determine its TypeScript type
 */
function analyzeValue(value: unknown, key: string = ''): TypeInfo {
  if (value === null || value === undefined) {
    return {
      type: 'unknown',
      isArray: false,
      isOptional: true,
    };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        type: 'unknown',
        isArray: true,
        isOptional: false,
      };
    }

    // Analyze first element to determine array type
    const firstElement = analyzeValue(value[0], key);
    return {
      ...firstElement,
      isArray: true,
    };
  }

  if (typeof value === 'object') {
    const children: Record<string, TypeInfo> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      children[childKey] = analyzeValue(childValue, childKey);
    }

    return {
      type: 'object',
      isArray: false,
      isOptional: false,
      children,
    };
  }

  // Primitive types
  return {
    type: typeof value,
    isArray: false,
    isOptional: false,
  };
}

/**
 * Convert a key to PascalCase for type names
 */
function toPascalCase(str: string): string {
  return str
    .split(/[_\-\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Create a signature for a TypeInfo to detect duplicates
 */
function createTypeSignature(typeInfo: TypeInfo): string {
  if (typeInfo.type !== 'object' || !typeInfo.children) {
    return `${typeInfo.type}${typeInfo.isArray ? '[]' : ''}${typeInfo.isOptional ? '?' : ''}`;
  }

  const childSignatures = Object.entries(typeInfo.children)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, child]) => `${key}:${createTypeSignature(child)}`)
    .join(',');

  return `{${childSignatures}}`;
}

/**
 * Map JSON types to TypeScript types
 */
function mapToTypeScriptType(jsonType: string): string {
  switch (jsonType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Generate a shorter, more generic name for shared types
 */
function generateSharedTypeName(
  signature: string,
  existingNames: string[]
): string {
  // Try to find common patterns in existing names
  const commonParts = existingNames
    .map((name) => {
      // Extract meaningful parts from the name
      const parts = name.split(/(?=[A-Z])/);
      return parts;
    })
    .reduce((acc, parts) => {
      parts.forEach((part) => {
        if (part.length > 2) {
          acc.set(part, (acc.get(part) || 0) + 1);
        }
      });
      return acc;
    }, new Map<string, number>());

  // Find the most common meaningful part
  let bestPart = '';
  let maxCount = 0;
  commonParts.forEach((count, part) => {
    if (count > maxCount && count > 1) {
      maxCount = count;
      bestPart = part;
    }
  });

  // Use the first name as base if no common part found
  if (!bestPart && existingNames.length > 0) {
    return existingNames[0];
  }

  return bestPart || 'Shared';
}

/**
 * Collect all type information with their names and signatures
 */
function collectTypeInfo(
  typeInfo: TypeInfo,
  typeName: string,
  collected: Map<string, { info: TypeInfo; names: string[] }> = new Map()
): Map<string, { info: TypeInfo; names: string[] }> {
  if (typeInfo.type !== 'object' || !typeInfo.children) {
    return collected;
  }

  const signature = createTypeSignature(typeInfo);

  // Add this type to the collection
  if (collected.has(signature)) {
    const existing = collected.get(signature)!;
    if (!existing.names.includes(typeName)) {
      existing.names.push(typeName);
    }
  } else {
    collected.set(signature, { info: typeInfo, names: [typeName] });
  }

  // Recursively collect nested types
  for (const [key, childInfo] of Object.entries(typeInfo.children)) {
    if (childInfo.type === 'object' && childInfo.children) {
      const nestedTypeName = `${typeName}${toPascalCase(key)}`;
      collectTypeInfo(childInfo, nestedTypeName, collected);
    }
  }

  return collected;
}

/**
 * Generate TypeScript type definition with deduplication
 */
function generateTypeDefinition(
  typeInfo: TypeInfo,
  typeName: string,
  typeMapping: Map<string, string>,
  generatedTypes: Set<string>
): string {
  const indentation = '';
  let result = '';

  if (typeInfo.type === 'object' && typeInfo.children) {
    const properties: string[] = [];

    for (const [key, childInfo] of Object.entries(typeInfo.children)) {
      if (childInfo.type === 'object' && childInfo.children) {
        const nestedTypeName = `${typeName}${toPascalCase(key)}`;
        const signature = createTypeSignature(childInfo);
        const actualTypeName = typeMapping.get(signature) || nestedTypeName;

        const optional = childInfo.isOptional ? '?' : '';
        const arrayNotation = childInfo.isArray ? '[]' : '';
        properties.push(
          `${indentation}  ${key}${optional}: ${actualTypeName}${arrayNotation};`
        );
      } else if (childInfo.type === 'object' && childInfo.isArray) {
        const optional = childInfo.isOptional ? '?' : '';
        properties.push(
          `${indentation}  ${key}${optional}: Record<string, unknown>[];`
        );
      } else {
        const optional = childInfo.isOptional ? '?' : '';
        const tsType = mapToTypeScriptType(childInfo.type);
        const arrayNotation = childInfo.isArray ? '[]' : '';
        properties.push(
          `${indentation}  ${key}${optional}: ${tsType}${arrayNotation};`
        );
      }
    }

    result += `${indentation}export interface ${typeName} {\n`;
    result += properties.join('\n') + '\n';
    result += `${indentation}}`;

    return result;
  }

  return result;
}

/**
 * Convert JSON to TypeScript type definition with deduplication
 */
export function convertJsonToTypeScript(
  json: unknown,
  typeName: string,
  exportType: 'interface' | 'type' = 'interface'
): string {
  const typeInfo = analyzeValue(json, typeName);

  if (typeInfo.type !== 'object') {
    throw new Error('Root JSON value must be an object');
  }

  // Collect all types with their signatures
  const collected = collectTypeInfo(typeInfo, typeName);

  // Create mapping from signature to canonical type name
  const typeMapping = new Map<string, string>();
  const typesToGenerate: Array<{ name: string; info: TypeInfo }> = [];

  collected.forEach(({ info, names }, signature) => {
    if (names.length > 1) {
      // Multiple types with same structure - use the shortest name
      const canonicalName = names.reduce((shortest, current) =>
        current.length < shortest.length ? current : shortest
      );
      typeMapping.set(signature, canonicalName);
      typesToGenerate.push({ name: canonicalName, info });
    } else {
      // Unique type
      typeMapping.set(signature, names[0]);
      typesToGenerate.push({ name: names[0], info });
    }
  });

  // Sort types by dependency (leaf types first)
  const sortedTypes = typesToGenerate.sort((a, b) => {
    const aDepth = a.name.split(/(?=[A-Z])/).length;
    const bDepth = b.name.split(/(?=[A-Z])/).length;
    return bDepth - aDepth; // Deeper types first
  });

  // Generate type definitions
  const generatedTypes = new Set<string>();
  const definitions: string[] = [];

  for (const { name, info } of sortedTypes) {
    if (!generatedTypes.has(name)) {
      generatedTypes.add(name);
      const definition = generateTypeDefinition(
        info,
        name,
        typeMapping,
        generatedTypes
      );
      if (definition) {
        definitions.push(definition);
      }
    }
  }

  return definitions.reverse().join('\n\n');
}
