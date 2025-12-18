export interface ConverterOptions {
  input: string;
  output?: string;
  name: string;
  optional?: boolean;
  exportType?: "interface" | "type";
}

export interface DummyGeneratorOptions {
  input: string;
  types: string;
  typeName: string;
  functionName: string;
  output?: string;
  async?: boolean;
  wrapper?: boolean;
  count?: number; // Jumlah data yang akan di-generate (default: 1)
}

export interface DummyGeneratorResult {
  code: string;
  data: any;
}

export interface TypeInfo {
  type: string;
  isArray: boolean;
  isOptional: boolean;
  children?: Record<string, TypeInfo>;
}

export interface ParsedTypeName {
  baseName: string;
  isArray: boolean;
}

export interface NestedTypeInfo {
  typeName: string;
  properties: Record<string, string>;
  dependencies: string[];
}
