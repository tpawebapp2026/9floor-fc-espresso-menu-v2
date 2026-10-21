import type { IncomingMessage, ServerResponse } from "node:http";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { authorize, bytes, fail, respond } from "../server/auth.ts";
export const config = { api: { bodyParser: false } };
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") return fail(res, 405, "POST သာ ခွင့်ပြုသည်");
  try {
    const client = await authorize(req);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        String(req.headers["content-type"]),
      )
    )
      return fail(res, 415, "JPEG / PNG / WebP သာ");
    const raw = await bytes(req, 4 * 1024 * 1024);
    const image = sharp(raw, { limitInputPixels: 25000000, animated: false });
    const meta = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || ""))
      return fail(res, 415, "ပုံဖိုင် မမှန်ပါ");
    // Decode and re-encode server-side, remove metadata, enforce pixel/byte bounds, use immutable names.
    const output = await image
      .rotate()
      .resize({
        width: 1400,
        height: 1400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const path = randomUUID() + ".webp";
    const { error } = await client.storage
      .from("recipe-images")
      .upload(path, output, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) throw error;
    const { data } = client.storage.from("recipe-images").getPublicUrl(path);
    respond(res, { url: data.publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    fail(
      res,
      message === "AUTH" || message === "DENIED"
        ? 403
        : message === "SIZE"
          ? 413
          : 400,
      "ပုံတင်မရပါ။ ဝင်ခွင့်၊ ပုံအရွယ်နှင့် ဖိုင်ကို စစ်ဆေးပါ။",
    );
  }
}
