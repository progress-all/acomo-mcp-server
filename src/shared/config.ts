export type AcomoMcpConfig = {
  baseUrl: string;
  apiVersion: string;
  tenantId: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  requestTimeoutMs: number;
  maxRetries: number;
  enableMutationTools: boolean;
  openapiPath: string;
};

export function getConfig(): AcomoMcpConfig {
  const baseUrl = process.env.ACOMO_API_BASE ?? "http://localhost:3000/api";
  const apiVersion = process.env.ACOMO_API_VERSION ?? "v1";
  const tenantId = required("ACOMO_TENANT_ID");
  const token = process.env.ACOMO_ACCESS_TOKEN;
  const clientId = process.env.ACOMO_CLIENT_ID;
  const clientSecret = process.env.ACOMO_CLIENT_SECRET;
  const requestTimeoutMs = Number(
    process.env.ACOMO_REQUEST_TIMEOUT_MS ?? 30000
  );
  const maxRetries = Number(process.env.ACOMO_MAX_RETRIES ?? 2);
  const enableMutationTools =
    (process.env.ACOMO_ENABLE_MUTATION_TOOLS ?? "false") === "true";
  const openapiPath =
    process.env.ACOMO_OPENAPI_PATH ??
    `${process.cwd()}/acomo-backend/openapi.json`;
  return {
    baseUrl,
    apiVersion,
    tenantId,
    token,
    clientId,
    clientSecret,
    requestTimeoutMs,
    maxRetries,
    enableMutationTools,
    openapiPath,
  };
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`環境変数 ${name} が未設定です`);
  return v;
}

