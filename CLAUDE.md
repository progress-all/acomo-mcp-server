# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that exposes the ACOMO API as tools for AI assistants. It's built with TypeScript using the MCP SDK and runs over stdio transport.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript to dist/)
npm run build

# Run in development mode (uses tsx for direct TypeScript execution)
npm run dev

# Run production build
npm run start

# Lint and fix code style issues
npm run lint
```

## Environment Configuration

The server uses the following environment variables:

- `ACOMO_TENANT_ID` (required for API calls): Tenant identifier
- `ACOMO_API_BASE` (default: `https://acomo.app`): API base URL
- `ACOMO_ACCESS_TOKEN` (required for API calls): Bearer token for authentication
- `ACOMO_REQUEST_TIMEOUT_MS` (default: `30000`): Request timeout in ms
- `ACOMO_OPENAPI_PATH` (default: bundled `openapi.json`): Absolute path to OpenAPI spec (override only if needed)

When running from the repository, you can leave `ACOMO_OPENAPI_PATH` unset to use the bundled `openapi.json`.

## Architecture

### Core Components

- **server.ts** (src/server.ts:21): Main MCP server implementation that registers tools and resources
- **openapi.ts** (src/openapi.ts:13): OpenAPI specification parser and operation utilities
- **config.ts** (src/shared/config.ts:13): Environment configuration management
- **http.ts** (src/shared/http.ts:4): HTTP client with ACOMO-specific headers and error handling

### MCP Tools Provided

1. **health**: Simple health check endpoint
2. **listApis**: Lists all available OpenAPI APIs
3. **describeApi**: Gets detailed info for a specific operationId
4. **apiSchemas**: Extracts parameters/requestBody/responses schemas
5. **generateApiRequestTemplate**: Creates request templates with placeholders
6. **listComponents**: Lists OpenAPI component schemas
7. **describeComponent**: Gets JSON schema for specific components
8. **callApi**: Executes API calls with path/query/body parameters

### MCP Resources Provided

- **openapi://acomo**: Full OpenAPI specification as JSON
- **guide://auth**: Authentication setup guide in markdown

### Key Technical Details

- Uses stdio transport for MCP communication (src/server.ts:255)
- OpenAPI spec is cached after first load (src/openapi.ts:11)
- HTTP requests include tenant-specific headers automatically (src/shared/http.ts:9)
- Path parameters are replaced using regex substitution (src/server.ts:192)
- Request bodies are JSON stringified for API calls (src/server.ts:209)
- URL construction handles both absolute and relative OpenAPI paths (src/openapi.ts:71)

## Testing and Deployment

The project includes Docker support via `Dockerfile` and is published to GitHub Container Registry. For local development, use the npm scripts. There are no test frameworks configured in this codebase.

## File Organization

- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript output (created by build)
- `openapi.json` - ACOMO API specification (bundled)
- Environment variables control runtime behavior
