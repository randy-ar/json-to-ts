/**
 * Service method configuration
 */
export interface ServiceMethod {
  name: string;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  requestBodyType?: string;
  responseType: string;
  responseTypePath?: string;
  dummyFunction?: string;
  dummyFunctionPath?: string;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  outputPath: string;
  basePath: string;
  className: string;
  methods: ServiceMethod[];
  mode: "create" | "update";
}

/**
 * Type generation config
 */
export interface TypeGenerationConfig {
  inputJson: string;
  outputTypes: string;
  typeName: string;
}

/**
 * Dummy generation config
 */
export interface DummyGenerationConfig {
  inputJson: string;
  outputDummy: string;
  typesFile: string;
  typeName: string;
  functionName: string;
}
