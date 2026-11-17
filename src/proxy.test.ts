import { describe, expect, it } from "vitest";
import { buildCsp } from "./proxy";

describe("buildCsp", () => {
  const csp = buildCsp("abc123", false);

  it("solo permite scripts con el nonce de la petición", () => {
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("bloquea que otros sitios incrusten la app", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("permite Supabase y Turnstile", () => {
    expect(csp).toContain(
      "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321 https://challenges.cloudflare.com",
    );
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
  });

  it("solo relaja eval en desarrollo", () => {
    expect(buildCsp("x", true)).toContain("'unsafe-eval'");
  });
});
