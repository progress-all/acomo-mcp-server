# acomo MCP ガイド

このドキュメントは、生成AIに与えるコンテキストとして、acomoとMCPサーバーの利用に必要な前提を簡潔にまとめています。

## 概要
- **ヘッドレスAPI**: acomoはワークフロー実行のAPI（OpenAPI準拠）。フロントは任意。
- **エンドポイントURL**: `${ACOMO_API_BASE}/${path}`（`path` は OpenAPI の `paths` に記載）
- **ヘッダ付与**: 認証・テナントの各ヘッダはMCPサーバーが環境変数から自動付与

## MCPの使い方
- **listApis**: 利用可能な`operationId`一覧
- **describeApi**: `method`/`path`/`summary`/`raw`
- **apiSchemas**: `parameters`/`requestBody`/`responses`スキーマ
- **generateApiRequestTemplate**: `pathParams`/`query`/`body`の雛形
- **callApi**: 実行（環境変数必須）
- 補助: **listComponents**, **describeComponent**（`components.schemas`の参照）

## callApi 入出力
- 必須: `operationId`
- 任意: `pathParams` / `query` / `body`（各APIのスキーマに従う）
- URL結合やヘッダ付与はサーバー側で処理されます

## acomo MCP server 環境変数
- `ACOMO_TENANT_ID`（必須）: `x-tenant-id`に使用
- `ACOMO_ACCESS_TOKEN`（必須）: `Authorization: Bearer <token>`に使用
- `ACOMO_API_BASE`（任意, 既定 `https://acomo.app`）
- `ACOMO_OPENAPI_PATH`（任意, 既定は同梱`openapi.json`）
- `ACOMO_REQUEST_TIMEOUT_MS`（任意, 既定 `30000`）

## ドメイン要点
- **WorkflowModel**: `definition`（ノード/エッジのグラフ）, `dataSchema`（入力/保存データの型）, `policy`（ノード×フィールドの権限制御）の組み合わせ。
- **WorkflowProcess**: 実行体。現在位置はトークンで表現し、履歴に遷移と差分を保存。
- **権限の3層**:
  - System Action（API実行可否）
  - Action（ノード実行可否: `start/submit/approve/reject/revert/...`）
  - Data Access（差分キーごとに`write`許可が必要）

## エンジンAPI（代表）
- `startWorkflowProcess` → `POST /engine/start/:modelId`
- `submitWorkflowProcess` / `submitWorkflowProcessWithNodeId`
- `approveWorkflowProcess` / `approveWorkflowProcessWithNodeId`
- `rejectWorkflowProcess` / `rejectWorkflowProcessWithNodeId`
- `revertWorkflowProcess`（`/:processId/:nodeId`）
- `saveWorkflowProcess`（`PUT`）

## 実行フロー
- 新規: start（開始時に初期遷移を自動評価）
- 入力/申請: save（任意）→ submit
- 承認/却下: approve | reject（複数候補があれば WithNodeId を使用）
- 取り戻し: revert（nodeId 指定が必須）

## BinaryExpression 概要
- 代表演算子: `> >= < <= == != has and or`
- 代表参照: `$user.*`, `$data.<field>`, `$executor(<nodeId>).id|groups`, `$token.*`, `$key.<name>`
- 用途: Action許可条件・経路分岐の評価

## dataSchema 概要
- ルート: `{ type: 'object', properties, additionalProperties: false }`
- 代表型: `string|number|date|enum|file|array|record`
- メタ: `title?`, `description?`, `_order`（UI補助）

## モデル定義 概要
- ルート: `{ nodes: Node[], edges: Edge[] }`
- Node（共通）: `id`, `name`, `type`（必要に応じ `eventType|actionPolicies|position|canRevert|keys|conditions`）
- Edge: `{ from: NodeId, to: NodeId, type: FlowType[] }`

## 注意点
- OpenAPIが唯一の仕様の出典。型/必須はOpenAPIを優先。
- 401/403はヘッダ不足、または System/Action/Data の不許可が原因になりやすい。
- 並列/分岐で複数ノードが同時可の場合、曖昧性回避のため `*WithNodeId` を使用。

## エラーの見かた
- 未設定: 必須環境変数が欠けていると実行不可エラー
- HTTP失敗: `HTTP <status>: <body>`で失敗を通知
- 401/403: ヘッダ不足、または System/Action/Data のいずれかの不許可
- タイムアウト: 既定30秒（`ACOMO_REQUEST_TIMEOUT_MS`で変更可）

## サンプル
```json
{
  "operationId": "startWorkflowProcess",
  "pathParams": { "modelId": "wf_model_id" },
  "body": { "data": { "title": "申請A" } }
}
```

## 参考
- 仕様の出典はOpenAPI。型/必須は常にOpenAPIを優先。
- 詳細な演算子やスキーマの網羅は省略。必要時は`describeApi`/`apiSchemas`で取得してください。
 - エンドポイントの`path`はOpenAPI specの`paths`に記載。URLは `${ACOMO_API_BASE}/${path}` で構成されます。
