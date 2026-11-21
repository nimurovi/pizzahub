"use client";

export class ApiAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

/**
 * Send an authenticated request only to this application's configured API.
 * Existing callers use both /api/... paths and absolute configured-API URLs.
 * Neither form may be used to forward credentials to a different origin.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL;

  if (!configuredBase) {
    throw new Error("The API URL is not configured.");
  }

  const baseUrl = new URL(configuredBase.replace(/\/+$/, "") + "/");
  if (!(["https:", "http:"].includes(baseUrl.protocol))) {
    throw new Error("Invalid API URL protocol.");
  }

  // Relative paths and exact same-origin absolute URLs are supported.
  // Do not accept protocol-relative URLs, escaped path separators, or redirects.
  if (
    !path.startsWith("/api/") &&
    !/^https?:\/\//i.test(path)
  ) {
    throw new Error("Invalid private API path.");
  }

  const target = new URL(path, baseUrl);
  if (
    target.origin !== baseUrl.origin ||
    !target.pathname.startsWith("/api/") ||
    target.pathname.startsWith("/api/auth/") ||
    target.pathname.startsWith("/api/stripe/") ||
    target.username ||
    target.password ||
    target.hash ||
    target.pathname.includes("\\")
  ) {
    throw new Error("Invalid private API path.");
  }

  const method = (options.method || "GET").toUpperCase();
  const isPublicMenuRead =
    (method === "GET" || method === "HEAD") &&
    (target.pathname === "/api/menu" ||
      target.pathname === "/api/menu/featured");

  const headers = new Headers(options.headers);
  // Ignore credentials supplied by callers: every private request gets a fresh
  // server-issued token and never reuses an attacker-provided bearer token.
  headers.delete("Authorization");

  if (!isPublicMenuRead) {
    // The Better Auth cookie is HttpOnly; the access token stays in memory.
    const tokenResponse = await fetch(
      new URL("/api/auth/token", baseUrl).href,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        redirect: "error",
        signal: options.signal,
      }
    );

    const tokenResult = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
      if (tokenResponse.status === 401 || tokenResponse.status === 403) {
        throw new ApiAuthError("Please sign in again.", tokenResponse.status);
      }
      throw new Error("Could not obtain an access token. Try again.");
    }
    if (typeof tokenResult?.token !== "string" || !tokenResult.token) {
      throw new ApiAuthError("Your session is not authenticated.");
    }
    headers.set("Authorization", `Bearer ${tokenResult.token}`);
  }

  const response = await fetch(target.href, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
    redirect: "error",
  });

  if (response.status === 401 && !isPublicMenuRead) {
    throw new ApiAuthError("Your session expired. Please sign in again.");
  }

  // Preserve 403 and validation errors for existing UI error handlers.
  return response;
}
