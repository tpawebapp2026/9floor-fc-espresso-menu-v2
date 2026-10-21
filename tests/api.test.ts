import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import sharp from "sharp";
const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  storageFrom: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mock.getUser },
    rpc: mock.rpc,
    from: mock.from,
    storage: { from: mock.storageFrom },
  }),
}));
import admin from "../api/admin";
import image from "../api/image";
const document = JSON.parse(readFileSync("public/recipes.json", "utf8"));
function request(
  body: unknown,
  options: {
    token?: string | null;
    type?: string;
    raw?: Buffer;
    method?: string;
  } = {},
) {
  const req = Readable.from([
    options.raw ?? Buffer.from(JSON.stringify(body)),
  ]) as IncomingMessage;
  req.method = options.method || "POST";
  req.headers = { "content-type": options.type || "application/json" };
  if (options.token !== null)
    req.headers.authorization = "Bearer " + (options.token || "test-token");
  return req;
}
function response() {
  const result = { status: 0, body: null as any, headers: {} as any };
  const res = {
    writeHead: (status: number, headers: any) => {
      result.status = status;
      result.headers = headers;
    },
    end: (text: string) => {
      result.body = JSON.parse(text);
    },
  } as unknown as ServerResponse;
  return { res, result };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-public-key");
  mock.getUser.mockResolvedValue({
    data: { user: { id: "test-admin" } },
    error: null,
  });
  mock.rpc.mockImplementation(async (name: string) =>
    name === "is_admin"
      ? { data: true, error: null }
      : { data: 1, error: null },
  );
  mock.upload.mockResolvedValue({ error: null });
  mock.storageFrom.mockReturnValue({
    upload: mock.upload,
    getPublicUrl: (path: string) => ({
      data: {
        publicUrl:
          "https://example.supabase.co/storage/v1/object/public/recipe-images/" +
          path,
      },
    }),
  });
});
afterEach(() => vi.unstubAllEnvs());
it("rejects missing JWT before any database write", async () => {
  const { res, result } = response();
  await admin(
    request(
      { action: "publish", document, expectedRevision: 0 },
      { token: null },
    ),
    res,
  );
  expect(result.status).toBe(403);
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.from).not.toHaveBeenCalled();
});
it("rejects invalid JWT before checking admin membership", async () => {
  mock.getUser.mockResolvedValue({
    data: { user: null },
    error: Error("expired"),
  });
  const { res, result } = response();
  await admin(
    request({ action: "publish", document, expectedRevision: 0 }),
    res,
  );
  expect(result.status).toBe(403);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("rejects authenticated non-admin and performs no publish", async () => {
  mock.rpc.mockResolvedValue({ data: false, error: null });
  const { res, result } = response();
  await admin(
    request({ action: "publish", document, expectedRevision: 0 }),
    res,
  );
  expect(result.status).toBe(403);
  expect(mock.rpc.mock.calls.map((x) => x[0])).toEqual(["is_admin"]);
});
it("rejects duplicate recipe data before the publish RPC", async () => {
  const invalid = structuredClone(document);
  invalid.recipes[0].id = invalid.recipes[1].id;
  const { res, result } = response();
  await admin(
    request({ action: "publish", document: invalid, expectedRevision: 0 }),
    res,
  );
  expect(result.status).toBe(400);
  expect(mock.rpc.mock.calls.map((x) => x[0])).toEqual(["is_admin"]);
});
it("passes validated document and expected revision to the atomic publish RPC", async () => {
  const { res, result } = response();
  await admin(
    request({ action: "publish", document, expectedRevision: 0 }),
    res,
  );
  expect(result.status).toBe(200);
  expect(result.body.revision).toBe(1);
  expect(mock.rpc).toHaveBeenLastCalledWith("publish_catalog", {
    document,
    expected_revision: 0,
  });
  expect(result.headers["Cache-Control"]).toBe("no-store");
});
it("reports version conflict without retrying or forcing an overwrite", async () => {
  mock.rpc.mockImplementation(async (name: string) =>
    name === "is_admin"
      ? { data: true, error: null }
      : { data: null, error: { message: "REVISION_CONFLICT" } },
  );
  const { res, result } = response();
  await admin(
    request({ action: "publish", document, expectedRevision: 0 }),
    res,
  );
  expect(result.status).toBe(409);
  expect(mock.rpc).toHaveBeenCalledTimes(2);
});
it("rejects an oversized JSON request before writing", async () => {
  const { res, result } = response();
  await admin(request(null, { raw: Buffer.alloc(4 * 1024 * 1024 + 1) }), res);
  expect(result.status).toBe(413);
  expect(mock.from).not.toHaveBeenCalled();
});
it("rejects an unauthenticated image upload before storage access", async () => {
  const { res, result } = response();
  await image(request(null, { token: null, type: "image/png" }), res);
  expect(result.status).toBe(403);
  expect(mock.storageFrom).not.toHaveBeenCalled();
});
it("rejects scripts disguised with an image MIME type", async () => {
  const { res, result } = response();
  await image(
    request(null, {
      type: "image/png",
      raw: Buffer.from('<svg onload="alert(1)"></svg>'),
    }),
    res,
  );
  expect([400, 415]).toContain(result.status);
  expect(mock.upload).not.toHaveBeenCalled();
});
it("actually decodes and converts a valid PNG to an immutable WebP before storage", async () => {
  const input = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#1b4c3f" },
  })
    .png()
    .toBuffer();
  const { res, result } = response();
  await image(request(null, { type: "image/png", raw: input }), res);
  expect(result.status).toBe(200);
  const [path, output, options] = mock.upload.mock.calls[0];
  expect(path).toMatch(/^[a-f0-9-]+\.webp$/);
  expect((await sharp(output).metadata()).format).toBe("webp");
  expect(options.upsert).toBe(false);
  expect(result.body.url).toContain(path);
});
