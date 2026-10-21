import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
export function fail(res: ServerResponse, status: number, message: string) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify({ error: message }));
}
export async function authorize(req: IncomingMessage) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw Error("CONFIG");
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) throw Error("AUTH");
  const client = createClient(url, key, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(auth.slice(7));
  if (error || !data.user) throw Error("AUTH");
  const check = await client.rpc("is_admin");
  if (check.error || check.data !== true) throw Error("DENIED");
  return client;
}
export async function bytes(req: IncomingMessage, max: number) {
  const chunks: Buffer[] = [];
  let count = 0;
  for await (const chunk of req) {
    const b = Buffer.from(chunk);
    count += b.length;
    if (count > max) throw Error("SIZE");
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}
export function respond(res: ServerResponse, result: unknown) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(result));
}
