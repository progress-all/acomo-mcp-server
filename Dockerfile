# syntax=docker/dockerfile:1

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy sources
COPY tsconfig.json ./
COPY src ./src
COPY openapi.json ./openapi.json

# Build
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts and assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openapi.json ./openapi.json

# Default OpenAPI path inside the image
ENV ACOMO_OPENAPI_PATH=/app/openapi.json

# OCI labels (help GHCR associate image with repo)
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# Stdio MCP server entrypoint
ENTRYPOINT ["node", "/app/dist/server.js"]
