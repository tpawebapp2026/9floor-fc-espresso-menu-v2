import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";

type NodeEndpoint = (
  request: IncomingMessage,
  response: ServerResponse,
) => Promise<unknown>;

// Preserve the existing API's JWT checks, streaming byte limits and upload validation.
export function webEndpoint(endpoint: NodeEndpoint) {
  return async (request: Request): Promise<Response> => {
    async function* body() {
      const reader = request.body?.getReader();
      if (!reader) return;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          yield Buffer.from(chunk.value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    }
    const incoming = Readable.from(body()) as IncomingMessage;
    incoming.method = request.method;
    incoming.url = new URL(request.url).pathname;
    incoming.headers = Object.fromEntries(request.headers);
    let status = 200;
    let finished = false;
    let result = "";
    const headers = new Headers();
    const outgoing = {
      writeHead(
        code: number,
        values: Record<string, string | number | readonly string[]>,
      ) {
        status = code;
        for (const [name, value] of Object.entries(values))
          headers.set(name, String(value));
      },
      end(value?: string | Uint8Array) {
        result =
          typeof value === "string"
            ? value
            : value
              ? Buffer.from(value).toString("utf8")
              : "";
        finished = true;
      },
    } as unknown as ServerResponse;
    try {
      await endpoint(incoming, outgoing);
      if (!finished) throw Error("INCOMPLETE_RESPONSE");
      return new Response(result, { status, headers });
    } catch {
      return Response.json(
        { error: "ဆာဗာလုပ်ဆောင်မှု မအောင်မြင်ပါ။" },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } finally {
      incoming.destroy();
    }
  };
}
