// MCP TypeScript SDK ベース実装
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { acomoFetch } from "./shared/http.js";
import {
  buildRequestTemplate,
  buildUrlForOpenApiPath,
  findOperationById,
  getComponentSchema,
  getOperationSchemas,
  listComponents,
  listOperations,
  loadOpenApi,
} from "./openapi.js";

async function main() {
  const server = new McpServer({ name: "acomo-mcp", version: "0.1.0" });

  // ----- Tools -----
  server.registerTool(
    "health",
    {
      title: "Health",
      description: "acomo MCP server health check (fixed response)",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: "ok" }] })
  );

  server.registerTool(
    "listOperations",
    {
      title: "List OpenAPI operations",
      description: "OpenAPIのoperation一覧を返す",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await listOperations()) }],
    })
  );

  server.registerTool(
    "describeOperation",
    {
      title: "Describe operation",
      description: "operationIdの詳細（paths/method/要約/原文）を返す",
      inputSchema: { operationId: z.string() },
    },
    async ({ operationId }: { operationId: string }) => {
      const op = await findOperationById(operationId);
      if (!op)
        return {
          content: [
            { type: "text", text: `Unknown operationId: ${operationId}` },
          ],
          isError: true,
        };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                operationId: op.operationId,
                method: op.method,
                path: op.path,
                summary: op.summary,
                raw: op.raw,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "operationSchemas",
    {
      title: "Operation schemas",
      description: "operationIdからparameters/requestBody/responsesを抜粋",
      inputSchema: { operationId: z.string() },
    },
    async ({ operationId }: { operationId: string }) => {
      const schemas = await getOperationSchemas(operationId);
      if (!schemas)
        return {
          content: [
            { type: "text", text: `Unknown operationId: ${operationId}` },
          ],
          isError: true,
        };
      return {
        content: [{ type: "text", text: JSON.stringify(schemas, null, 2) }],
      };
    }
  );

  server.registerTool(
    "generateRequestTemplate",
    {
      title: "Generate request template",
      description: "operationIdからpath/query/body雛形を生成",
      inputSchema: { operationId: z.string() },
    },
    async ({ operationId }: { operationId: string }) => {
      const schemas = await getOperationSchemas(operationId);
      if (!schemas)
        return {
          content: [
            { type: "text", text: `Unknown operationId: ${operationId}` },
          ],
          isError: true,
        };
      const tmpl = buildRequestTemplate(schemas);
      return {
        content: [{ type: "text", text: JSON.stringify(tmpl, null, 2) }],
      };
    }
  );

  server.registerTool(
    "listComponents",
    {
      title: "List components",
      description: "OpenAPI components.schemas の一覧を返す",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await listComponents()) }],
    })
  );

  server.registerTool(
    "describeComponent",
    {
      title: "Describe component",
      description: "指定schema名の詳細（JSON Schema）を返す",
      inputSchema: { name: z.string() },
    },
    async ({ name }: { name: string }) => {
      const schema = await getComponentSchema(name);
      if (!schema)
        return {
          content: [{ type: "text", text: `Unknown component: ${name}` }],
          isError: true,
        };
      return {
        content: [{ type: "text", text: JSON.stringify(schema, null, 2) }],
      };
    }
  );

  server.registerTool(
    "callOperation",
    {
      title: "Call operation",
      description: "operationIdを指定してAPIを呼び出す（検証最小限）",
      inputSchema: {
        operationId: z.string(),
        pathParams: z.record(z.any()).optional(),
        query: z.record(z.any()).optional(),
        body: z.any().optional(),
      },
    },
    async ({
      operationId,
      pathParams,
      query,
      body,
    }: {
      operationId: string;
      pathParams?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: unknown;
    }) => {
      const op = await findOperationById(operationId);
      if (!op)
        return {
          content: [
            { type: "text", text: `Unknown operationId: ${operationId}` },
          ],
          isError: true,
        };
      let path = op.path;
      for (const [k, v] of Object.entries(pathParams || {})) {
        path = path.replace(
          new RegExp(`{${k}}`, "g"),
          encodeURIComponent(String(v))
        );
      }
      const urlPath = buildUrlForOpenApiPath(path);
      const qs = new URLSearchParams();
      if (query) {
        for (const [k, v] of Object.entries(query as Record<string, any>)) {
          qs.append(k, typeof v === "string" ? v : JSON.stringify(v));
        }
      }
      const search = qs.toString() ? `?${qs.toString()}` : "";
      const res = await acomoFetch(
        `${urlPath.replace(/^.*\/(api\/v\d+)/, "/$1")}${search}`,
        { method: op.method, body: body ? JSON.stringify(body) : undefined }
      );
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  // ----- Resources -----
  server.registerResource(
    "openapi",
    new ResourceTemplate("openapi://acomo", { list: undefined }),
    {
      title: "acomo OpenAPI",
      description: "acomo OpenAPI specification",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const spec = await loadOpenApi();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(spec, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "auth-guide",
    new ResourceTemplate("guide://auth", { list: undefined }),
    {
      title: "acomo Auth guide",
      description: "acomo認証・ヘッダ設定",
      mimeType: "text/markdown",
    },
    async (uri: URL) => {
      const text = `acomo認証・ヘッダ設定:\n\n- Authorization: Bearer <ACCESS_TOKEN>\n- x-tenant-id: <TENANT_ID>\n\nNext.jsサーバ側例:\n\nconst headers = {\n  Authorization: 'Bearer ' + process.env.ACOMO_ACCESS_TOKEN,\n  'x-tenant-id': process.env.ACOMO_TENANT_ID,\n  'Content-Type': 'application/json',\n};\n`;
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text }],
      };
    }
  );

  // ----- Start (stdio) -----
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[acomo-mcp] server error:", err);
  process.exit(1);
});
