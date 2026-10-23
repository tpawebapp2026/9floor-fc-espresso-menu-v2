import { afterEach, expect, it, vi } from "vitest";
import admin from "../netlify/functions/admin";
import image from "../netlify/functions/image";
import { webEndpoint } from "../server/web-adapter";
import { bytes, fail, respond } from "../server/auth";

afterEach(() => vi.unstubAllEnvs());
it("both Netlify routes preserve method restrictions and never cache API errors", async () => {
  for (const endpoint of [admin, image]) {
    const result = await endpoint(
      new Request("https://preview.example/api/test"),
    );
    expect(result.status).toBe(405);
    expect(result.headers.get("cache-control")).toBe("no-store");
  }
});
it("the Netlify admin route fails closed before database access when configuration or JWT is missing", async () => {
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_ANON_KEY", "");
  expect(
    (
      await admin(
        new Request("https://preview.example/api/admin", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
  ).toBe(503);
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-public-key");
  expect(
    (
      await admin(
        new Request("https://preview.example/api/admin", {
          method: "POST",
          body: "not-json",
        }),
      )
    ).status,
  ).toBe(403);
});
it("the web adapter preserves binary upload bytes and normalizes authorization headers", async () => {
  const original = new Uint8Array([0, 255, 1, 128, 10, 13]);
  const endpoint = webEndpoint(async (req, res) =>
    respond(res, {
      bytes: [...(await bytes(req, 64))],
      auth: req.headers.authorization,
      type: req.headers["content-type"],
    }),
  );
  const result = await endpoint(
    new Request("https://preview.example/api/image", {
      method: "POST",
      body: original,
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "image/png",
      },
    }),
  );
  expect(await result.json()).toEqual({
    bytes: [...original],
    auth: "Bearer test-token",
    type: "image/png",
  });
});
it("streaming byte limits still reject oversized uploads through the web boundary", async () => {
  const endpoint = webEndpoint(async (req, res) => {
    try {
      await bytes(req, 4);
      respond(res, { saved: true });
    } catch {
      fail(res, 413, "too large");
    }
  });
  const result = await endpoint(
    new Request("https://preview.example/api/image", {
      method: "POST",
      body: new Uint8Array(5),
    }),
  );
  expect(result.status).toBe(413);
});
it("an unexpected handler failure returns a generic uncached error without exception details", async () => {
  const endpoint = webEndpoint(async () => {
    throw Error("private database diagnostic");
  });
  const result = await endpoint(
    new Request("https://preview.example/api/admin"),
  );
  expect(result.status).toBe(500);
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect(await result.text()).not.toContain("private database diagnostic");
});
