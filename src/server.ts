// MCP TypeScript SDK ベース実装
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import { acomoFetch } from "./shared/http.js";
import { getConfig } from "./shared/config.js";
import {
  buildRequestTemplate,
  findOperationById,
  getComponentSchema,
  getOperationSchemas,
  listComponents,
  listOperations,
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
    "listApis",
    {
      title: "List APIs",
      description: "acomoのAPI一覧を返す",
      inputSchema: {},
    },
    async () => ({
      content: [
        { type: "text", text: JSON.stringify(await listOperations()) },
      ],
    })
  );

  server.registerTool(
    "describeApi",
    {
      title: "Describe API",
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
      const cfg = getConfig();
      const base = cfg.baseUrl.replace(/\/$/, "");
      const completeUrl = `${base}${op.path.startsWith("/") ? "" : "/"}${op.path}`;
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
                baseUrlExample: base,
                completeUrl,
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
    "apiSchemas",
    {
      title: "API schemas",
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
        content: [
          { type: "text", text: JSON.stringify(schemas, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "generateApiRequestTemplate",
    {
      title: "Generate API request template",
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
        content: [
          { type: "text", text: JSON.stringify(tmpl, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "callApi",
    {
      title: "Call API",
      description: "operationIdを指定してAPIを呼び出す",
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
      const cfg = getConfig();
      const missingVars: string[] = [];
      if (!cfg.tenantId) missingVars.push("ACOMO_TENANT_ID");
      if (!cfg.token) missingVars.push("ACOMO_ACCESS_TOKEN");
      if (missingVars.length) {
        return {
          content: [
            {
              type: "text",
              text: `環境変数が未設定のため実行できません: ${missingVars.join(", ")}`,
            },
          ],
          isError: true,
        };
      }
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
      const normalizedPath = path;
      const qs = new URLSearchParams();
      if (query) {
        for (const [k, v] of Object.entries(query as Record<string, any>)) {
          qs.append(k, typeof v === "string" ? v : JSON.stringify(v));
        }
      }
      const search = qs.toString() ? `?${qs.toString()}` : "";
      const res = await acomoFetch(
        `${normalizedPath}${search}`,
        { method: op.method, body: body ? JSON.stringify(body) : undefined }
      );
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  

  // ----- Prompts -----
  server.registerPrompt(
    "guide",
    {
      title: "acomo Implementation Assistant",
      description: "Assists with design and implementation guided by the acomo API and principles.",
      argsSchema: {
        request: z.string().describe("User request message").optional(),
      },
    },
    async (args: { request?: string } = {}, _extra) => {
      const request = args.request?.trim();
      let guideText = "";
      try {
        guideText = await readFile(new URL("../resources/guide-acomo.md", import.meta.url), "utf-8");
      } catch {
        guideText = "acomo MCP ガイドを取得できませんでした。resources/guide-acomo.md を確認してください。";
      }

      const userText = request || "(no request provided)";

      return {
        description: "Implementation support based on acomo API and concepts",
        messages: [
          {
            role: "user",
            content: { type: "text", text: userText },
          },
          {
            role: "user",
            content: { type: "resource", resource: { uri: "guide://acomo", text: guideText } },
          },
        ],
      };
    }
  );

  server.registerTool(
    "listComponents",
    {
      title: "List components",
      description: "acomoのAPIスキーマ（components.schemas）の一覧を返す",
      inputSchema: {},
    },
    async () => ({
      content: [
        { type: "text", text: JSON.stringify(await listComponents()) },
      ],
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
        content: [
          { type: "text", text: JSON.stringify(schema, null, 2) },
        ],
      };
    }
  );


  // ----- Resources -----
  server.registerResource(
    "acomo-guide",
    new ResourceTemplate("guide://acomo", { list: undefined }),
    {
      title: "acomo MCP guide",
      description: "acomo開発の前提・認証・MCPの使い方の要点",
      mimeType: "text/markdown",
    },
    async (uri: URL) => {
      try {
        const text = await readFile(new URL("../resources/guide-acomo.md", import.meta.url), "utf-8");
        return {
          contents: [{ uri: uri.href, mimeType: "text/markdown", text }],
        };
      } catch {
        const fallback = `# acomo MCP ガイド\n\nこのドキュメントは、acomo MCP を使って acomo API を探索・呼び出す際に最低限必要な前提と手順をまとめたものです。\n\n## 認証とテナント\n- Authorization: Bearer <ACCESS_TOKEN>\n- x-tenant-id: <TENANT_ID>\n- 環境変数: \n  - ACOMO_TENANT_ID\n  - ACOMO_ACCESS_TOKEN\n  - (任意) ACOMO_API_BASE = https://acomo.app\n\n## MCP ツールの流れ\n1. listApis: 利用可能な operationId 一覧を取得\n2. describeApi: operationId ごとの詳細（method/path/summary/raw）を確認\n3. apiSchemas: parameters / requestBody / responses のスキーマを確認\n4. generateApiRequestTemplate: path/query/body の雛形を作成\n5. callApi: operationId とテンプレートを使って実行（要: 環境変数）\n\n## callApi の入力\n- pathParams: OpenAPI の {id} のようなパス変数を置換\n- query: URLSearchParams でエンコード（オブジェクトは JSON 文字列化）\n- body: JSON で送信\n\n## 実装上の約束事\n- OpenAPI の先頭パス (/api/v{n}) はそのまま使用\n- 失敗時はエラーメッセージとこのガイドを返す\n- ページネーションやフィルタは API ごとのスキーマに準拠\n\n## よくあるエラー\n- 環境変数未設定: ACOMO_TENANT_ID, ACOMO_ACCESS_TOKEN を設定\n- 不明な operationId: listApis で再確認\n\n## 参考\n- OpenAPI 自体はツール (listApis/describeApi/apiSchemas) から参照可能です。\n`;
        return {
          contents: [
            { uri: uri.href, mimeType: "text/markdown", text: fallback },
          ],
        };
      }
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
