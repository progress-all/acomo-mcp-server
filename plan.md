# acomo-mcp-server 開発計画（plan）

本ドキュメントは、acomo MCP サーバの改善計画をまとめたものです。参照系（OpenAPI ドキュメント活用）と実行系（安全な API 呼び出し）の双方を強化し、LLM/開発者が仕様検索から実行まで素早く到達できる体験を提供します。

## 目的

- acomo API を知らない開発者/LLM が「探す→理解→実装→確認」を滑らかに実行できるようにする
- 参照系と実行系の機能・ドキュメント・運用の一貫性を担保する
- Next.js 等のフロントエンドを Cursor/Claude Code などのコードアシスタントと併用して開発する際、acomo API の思想・設計に沿った正確な API 選択・呼び出しを本 MCP が検索・ガイド・検証・プレビュー・実行まで一貫して支援する

## 現状サマリ

- ツール: health, listApis, describeApi, apiSchemas, generateApiRequestTemplate, listComponents, describeComponent, callApi
- リソース: openapi://acomo, guide://auth（廃止予定: Tools経由でガイド提供に移行）
- 実装: `src/server.ts`, `src/openapi.ts`, `src/shared/http.ts`, `src/shared/config.ts`
- 導入: Docker イメージ提供、Node（stdio）実行可

## 強み

- 参照系と実行系の分離が明確
- OpenAPI を単一ソースとして参照・雛形生成を提供
- 依存が少なくシンプル、Docker で導入容易

## 課題（抜粋）

- ドキュメントと実装の不整合（`ACOMO_MAX_RETRIES` など未使用項目）
- HTTP クライアントの堅牢性不足（リトライ/バックオフ/非 JSON 対応）
- OpenAPI 解釈が最小限（$ref, style/explode, multipart 未対応）
- UX 改善余地（API 検索/サンプル生成/エラー文言）
- OpenAPI キャッシュのリロード不可

## 改善方針（優先度）

- 高: `searchApis`/`listTags`、`validateRequest`/`previewApiCall`
- 高: `serverInfo`（サーバ/スペックの軽量メタ情報: バージョン・ベースURL・OpenAPI 概要/件数）
- 中: HTTP リトライ/バックオフ、OpenAPI $ref/style 対応、`reloadOpenApi`、エラーメッセージ改善

## タスク（チェックリスト）

- [ ] ドキュメント整合（`README.md`/`CLAUDE.md` と実装の同期、既定値の正確化）
- [ ] HTTP クライアント小改善（GET の Content-Type 抑止、非 JSON 取り扱い、構造化エラー）
- [ ] 失敗時の再試行（軽量バックオフ）実装（環境変数に依存せず内部既定で実装）
- [ ] `searchApis`/`listTags` の追加（operationId/path/summary/tags の全文検索とタグ逆引き）
- [ ] `validateRequest`/`previewApiCall` の追加（OpenAPI 検証と実行前プレビュー）
- [ ] `serverInfo` の追加（サーバ/スペックのメタ情報）
- [ ] `searchComponents` の追加（components.schemas を検索）
- [ ] Resources 提供の廃止（`openapi://acomo`, `guide://auth` を削除）
- [ ] Guides を Tools で提供（`listGuides`/`getGuide`/`searchGuides` の追加。`design`/`auth`/`errors`/`pagination` ほか）
- [ ] OpenAPI: `$ref`/`style`/`explode` 対応の拡張（multipart は `callApi` の Content-Type 対応として扱う）
- [ ] `callApi` 改良（未解決パスパラ検出、Content-Type 自動、レスポンス整形統一）
- [ ] `reloadOpenApi` の追加（キャッシュクリア）
- [ ] `describeApi`/`apiSchemas` の出力強化（OpenAPI の examples があれば併記）
- [ ] テスト/CI（lint/typecheck/build/test、Docker ビルド/公開）

## マイルストーン目安

- M1: ドキュメント整合＋検索/検証/プレビューの追加（v0.2.0）
- M2: 軽量リトライ/リロード/エラー整備（v0.3.0）
- M3: OpenAPI 準拠性拡張（`$ref`/`style`/`explode`、multipart 対応を `callApi` に内包）（v0.4.0）
- M4+: オプション機能（`describeSecurity` などドキュメント拡張）（v0.5.0+）

## 受け入れ基準（例）

- `searchApis` でキーワードから対象 API を返す
- `validateRequest` が必須パラメータ不足や型不一致を検知して報告する
- `previewApiCall` が最終 URL/メソッド/ヘッダ/ボディを正しく表示する
- 軽量リトライにより一時的な 429/5xx で最終的に成功（または明確なエラー）となる
- `README.md`/`CLAUDE.md` と実装が一致、CI がグリーン
