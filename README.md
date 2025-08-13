# acomo-mcp-server

acomo API をツールから扱えるようにする MCP (Model Context Protocol) サーバです。stdio トランスポートで動作します。


## 必要条件

- Node.js 18+（推奨: 20+）
- `ACOMO_TENANT_ID`（必須）

## インストールとビルド

```bash
npm install
npm run build
```

## 実行（ローカル）

```bash
ACOMO_TENANT_ID=<tenant> \
ACOMO_ACCESS_TOKEN=<token-optional> \
ACOMO_API_BASE="http://localhost:3000/api" \
ACOMO_API_VERSION="v1" \
ACOMO_OPENAPI_PATH="/absolute/path/to/this/repo/openapi.json" \
node dist/server.js
```

注意:

- 本リポは `openapi.json` を同梱しています。`ACOMO_OPENAPI_PATH` にその絶対パスを設定してください。
- 既定の `openapiPath` はモノリポ想定の `./acomo-backend/openapi.json` を指すため、単独リポでは環境変数の指定が必要です。

## 環境変数

- `ACOMO_API_BASE`（既定: `http://localhost:3000/api`）
- `ACOMO_API_VERSION`（既定: `v1`）
- `ACOMO_TENANT_ID`（必須）
- `ACOMO_ACCESS_TOKEN`（任意: Bearer トークン）
- `ACOMO_ENABLE_MUTATION_TOOLS`（既定: `false`）
- `ACOMO_REQUEST_TIMEOUT_MS`（既定: `30000`）
- `ACOMO_MAX_RETRIES`（既定: `2`）
- `ACOMO_OPENAPI_PATH`（例: `/absolute/path/to/repo/openapi.json`）

## MCP クライアント設定例（Cursor / Claude Desktop）

```json
{
  "mcpServers": {
    "acomo": {
      "command": "node",
      "args": ["/absolute/path/to/repo/dist/server.js"],
      "env": {
        "ACOMO_API_BASE": "http://localhost:3000",
        "ACOMO_API_VERSION": "v1",
        "ACOMO_TENANT_ID": "<tenant-id>",
        "ACOMO_ACCESS_TOKEN": "<access-token>",
        "ACOMO_ENABLE_MUTATION_TOOLS": "false",
        "ACOMO_REQUEST_TIMEOUT_MS": "30000",
        "ACOMO_MAX_RETRIES": "2",
        "ACOMO_OPENAPI_PATH": "/absolute/path/to/repo/openapi.json"
      }
    }
  }
}
```

## 提供ツール（Tools）

- `health`: ヘルスチェック
- `listOperations`: OpenAPI の operation 一覧
- `describeOperation`: 指定 `operationId` の詳細
- `operationSchemas`: `parameters` / `requestBody` / `responses` の抜粋
- `generateRequestTemplate`: パラメータ・ボディの雛形生成
- `listComponents`: `components.schemas` の一覧
- `describeComponent`: 指定スキーマの JSON Schema
- `callOperation`: 指定 `operationId` で API 呼び出し

## 提供リソース（Resources）

- `openapi://acomo`: OpenAPI 仕様全体（application/json）
- `guide://auth`: 認証・ヘッダ設定の簡易ガイド（text/markdown）

## ライセンス

MIT License. 詳細は `LICENSE` を参照してください。

