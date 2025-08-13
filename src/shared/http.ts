import fetch, { RequestInit } from "node-fetch";
import { getConfig } from "./config.js";

export async function acomoFetch(path: string, init?: RequestInit) {
  const cfg = getConfig();
  const base = cfg.baseUrl.replace(/\/$/, "");
  const joined = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const url = joined;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
    "Content-Type": "application/json",
  };
  if (cfg.token) {
    headers["Authorization"] = `Bearer ${cfg.token}`;
  }
  if (cfg.tenantId) {
    headers["x-tenant-id"] = cfg.tenantId;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timeout);
  }
}

