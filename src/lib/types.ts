export interface ConverterOptions {
  input: string;
  output?: string;
  name: string;
  optional?: boolean;
  exportType?: 'interface' | 'type';
}

export interface DummyGeneratorOptions {
  input: string;
  types: string;
  typeName: string;
  functionName: string;
  output?: string;
  async?: boolean;
  wrapper?: boolean;
}

export interface TypeInfo {
  type: string;
  isArray: boolean;
  isOptional: boolean;
  children?: Record<string, TypeInfo>;
}
