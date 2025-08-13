import fetch, { RequestInit } from "node-fetch";
import { getConfig } from "./config.js";

export async function acomoFetch(path: string, init?: RequestInit) {
  const cfg = getConfig();
  const base = cfg.baseUrl.replace(/\/$/, "");
  const joined = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const url = joined;
  const headers = {
    ...(init?.headers as Record<string, string>),
    Authorization: cfg.token
      ? `Bearer ${cfg.token}`
      : (init?.headers as any)?.Authorization,
    "x-tenant-id": cfg.tenantId,
    "Content-Type": "application/json",
  };
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

