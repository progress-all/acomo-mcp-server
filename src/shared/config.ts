export type AcomoMcpConfig = {
  baseUrl: string;
  tenantId?: string;
  token?: string;
  requestTimeoutMs: number;
  openapiPath: string;
};

export function getConfig(): AcomoMcpConfig {
  const baseUrl = process.env.ACOMO_API_BASE ?? "https://acomo.app";
  const tenantId = process.env.ACOMO_TENANT_ID;
  const token = process.env.ACOMO_ACCESS_TOKEN;
  const requestTimeoutMs = Number(
    process.env.ACOMO_REQUEST_TIMEOUT_MS ?? 30000
  );
  const openapiPath =
    process.env.ACOMO_OPENAPI_PATH ?? `${process.cwd()}/openapi.json`;
  return {
    baseUrl,
    tenantId,
    token,
    requestTimeoutMs,
    openapiPath,
  };
}

