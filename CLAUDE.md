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

The server requires environment variables for configuration:

- `ACOMO_TENANT_ID` (required): Tenant identifier
- `ACOMO_API_BASE` (default: `https://acomo.app`): API base URL
- `ACOMO_ACCESS_TOKEN` (optional): Bearer token for authentication
- `ACOMO_ENABLE_MUTATION_TOOLS` (default: `false`): Enable write operations
- `ACOMO_REQUEST_TIMEOUT_MS` (default: `30000`): Request timeout
- `ACOMO_MAX_RETRIES` (default: `2`): Retry attempts
- `ACOMO_OPENAPI_PATH` (default: `./acomo-backend/openapi.json`): Path to OpenAPI spec

For standalone repository usage, always set `ACOMO_OPENAPI_PATH` to the absolute path of the included `openapi.json` file.

## Architecture

### Core Components

- **server.ts** (src/server.ts:21): Main MCP server implementation that registers tools and resources
- **openapi.ts** (src/openapi.ts:13): OpenAPI specification parser and operation utilities
- **config.ts** (src/shared/config.ts:13): Environment configuration management
- **http.ts** (src/shared/http.ts:4): HTTP client with ACOMO-specific headers and error handling

### MCP Tools Provided

1. **health**: Simple health check endpoint
2. **listOperations**: Lists all available OpenAPI operations
3. **describeOperation**: Gets detailed info for a specific operationId
4. **operationSchemas**: Extracts parameters/requestBody/responses schemas
5. **generateRequestTemplate**: Creates request templates with placeholders
6. **listComponents**: Lists OpenAPI component schemas
7. **describeComponent**: Gets JSON schema for specific components
8. **callOperation**: Executes API calls with path/query/body parameters

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