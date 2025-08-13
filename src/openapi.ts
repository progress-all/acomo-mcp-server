import { readFile } from "fs/promises";
import { getConfig } from "./shared/config.js";

export type OpenApiSpec = {
  openapi?: string;
  info?: any;
  paths?: Record<string, Record<string, any>>;
  components?: { schemas?: Record<string, any> };
};

let cache: OpenApiSpec | undefined;

export async function loadOpenApi(): Promise<OpenApiSpec> {
  if (cache) return cache as OpenApiSpec;
  const cfg = getConfig();
  const text = await readFile(cfg.openapiPath, "utf-8");
  cache = JSON.parse(text);
  return cache as OpenApiSpec;
}

export type Operation = {
  operationId?: string;
  method: string;
  path: string;
  summary?: string;
};

export async function listOperations(): Promise<Operation[]> {
  const spec = await loadOpenApi();
  const result: Operation[] = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods ?? {})) {
      // skip non-http verbs
      if (
        !["get", "post", "put", "delete", "patch", "head", "options"].includes(
          method.toLowerCase()
        )
      )
        continue;
      result.push({
        operationId: (op as any)?.operationId,
        method: method.toUpperCase(),
        path,
        summary: (op as any)?.summary,
      });
    }
  }
  return result;
}

export async function findOperationById(
  operationId: string
): Promise<(Operation & { raw: any }) | null> {
  const spec = await loadOpenApi();
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods ?? {})) {
      if ((op as any)?.operationId === operationId) {
        return {
          operationId,
          method: method.toUpperCase(),
          path,
          summary: (op as any)?.summary,
          raw: op,
        };
      }
    }
  }
  return null;
}


// ----- Components (DTO/Entity Schemas) -----
export async function listComponents(): Promise<string[]> {
  const spec = await loadOpenApi();
  return Object.keys(spec.components?.schemas ?? {});
}

export async function getComponentSchema(name: string): Promise<any | null> {
  const spec = await loadOpenApi();
  return spec.components?.schemas?.[name] ?? null;
}

// ----- Operation schemas (parameters/request/response) -----
export async function getOperationSchemas(operationId: string): Promise<{
  operationId: string;
  method: string;
  path: string;
  parameters: any[]; // path/query/header
  requestBody?: any; // schema if available
  responses?: Record<string, any>; // status -> schema/desc
} | null> {
  const found = await findOperationById(operationId);
  if (!found) return null;
  const op = found.raw || {};
  const parameters = op.parameters ?? [];
  let requestBody: any | undefined;
  if (op.requestBody?.content) {
    // prefer application/json
    const json = op.requestBody.content['application/json'] || Object.values(op.requestBody.content)[0];
    requestBody = json?.schema ?? json;
  }
  const responses: Record<string, any> = {};
  if (op.responses) {
    for (const [code, res] of Object.entries(op.responses)) {
      const content = (res as any)?.content;
      const json = content?.['application/json'] || (content && Object.values(content)[0]);
      responses[code] = json?.schema ?? (res as any)?.description ?? res;
    }
  }
  return {
    operationId,
    method: found.method,
    path: found.path,
    parameters,
    requestBody,
    responses,
  };
}

export function buildRequestTemplate(opSchemas: {
  operationId: string;
  method: string;
  path: string;
  parameters: any[];
  requestBody?: any;
}) {
  const pathParams: Record<string, string> = {};
  const query: Record<string, any> = {};
  for (const p of opSchemas.parameters ?? []) {
    if (p.in === 'path') pathParams[p.name] = `<${p.name}>`;
    if (p.in === 'query') query[p.name] = `<${p.name}>`;
  }
  const body = opSchemas.requestBody ? buildBodySkeleton(opSchemas.requestBody) : undefined;
  return {
    operationId: opSchemas.operationId,
    method: opSchemas.method,
    path: opSchemas.path,
    pathParams,
    query: Object.keys(query).length ? query : undefined,
    body,
  };
}

function buildBodySkeleton(schema: any): any {
  if (!schema) return undefined;
  if (schema.$ref) return { $ref: schema.$ref };
  if (schema.type === 'object' && schema.properties) {
    const obj: any = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      obj[k] = buildBodySkeleton(v);
    }
    return obj;
  }
  if (schema.type === 'array') {
    return [buildBodySkeleton(schema.items ?? {})];
  }
  if (schema.enum) return schema.enum[0] ?? null;
  switch (schema.type) {
    case 'string':
      return '<string>';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    default:
      return null;
  }
}
