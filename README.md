# acomo-mcp-server

acomo API をツールから扱えるようにする MCP (Model Context Protocol) サーバです。stdio トランスポートで動作します。OpenAPI に基づく operation 一覧やスキーマ参照、リクエスト雛形生成、API 呼び出し（問い合わせ）も行えます。

## 環境変数

- `ACOMO_API_BASE`（既定: `https://acomo.app`）
- `ACOMO_TENANT_ID`（必須）
- `ACOMO_ACCESS_TOKEN`（任意: Bearer トークン）
- `ACOMO_ENABLE_MUTATION_TOOLS`（既定: `false`）
- `ACOMO_REQUEST_TIMEOUT_MS`（既定: `30000`）
- `ACOMO_MAX_RETRIES`（既定: `2`）
- `ACOMO_OPENAPI_PATH`（例: `/absolute/path/to/repo/openapi.json`）

## MCP クライアント設定例（推奨: Docker）

以下は `mcpServers` 設定です。

```json
{
  "mcpServers": {
    "acomo": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ACOMO_API_BASE=https://acomo.app",
        "-e", "ACOMO_TENANT_ID=<tenant-id>",
        "-e", "ACOMO_ACCESS_TOKEN=<access-token-optional>",
        "ghcr.io/progress-all/acomo-mcp-server:latest"
      ]
    }
  }
}
```

## 代替: ソースから実行する場合（git clone → 実行）

Node.js 18+（推奨: 20+）

1. リポジトリを取得してビルドします。

   ```bash
   git clone https://github.com/progress-all/acomo-mcp-server.git
   cd acomo-mcp-server
   npm ci
   npm run build
   ```

2. `mcpServers` 設定（Node 実行）

   ```json
   {
     "mcpServers": {
       "acomo": {
         "command": "node",
         "args": ["/absolute/path/to/repo/dist/server.js"],
         "env": {
           "ACOMO_API_BASE": "https://acomo.app",
           "ACOMO_TENANT_ID": "<tenant-id>",
           "ACOMO_ACCESS_TOKEN": "<access-token-optional>"
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
