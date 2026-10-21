import type { IncomingMessage, ServerResponse } from "node:http";
import { CatalogSchema } from "../src/model.ts";
import { authorize, bytes, fail, respond } from "../server/auth.ts";
export const config = { api: { bodyParser: false } };
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") return fail(res, 405, "POST သာ ခွင့်ပြုသည်");
  try {
    const client = await authorize(req);
    const body = JSON.parse(
      (await bytes(req, 4 * 1024 * 1024)).toString("utf8"),
    );
    if (["save-draft", "publish"].includes(body.action)) {
      const document = CatalogSchema.parse(body.document);
      if (body.action === "save-draft") {
        const { error } = await client
          .from("catalog_drafts")
          .upsert({
            id: "main",
            document,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        return respond(res, { saved: true });
      }
      if (
        !Number.isSafeInteger(body.expectedRevision) ||
        body.expectedRevision < 0
      )
        return fail(res, 400, "ဗားရှင်း မမှန်ပါ");
      const { data, error } = await client.rpc("publish_catalog", {
        document,
        expected_revision: body.expectedRevision,
      });
      if (error) {
        if (error.message.includes("REVISION_CONFLICT"))
          return fail(
            res,
            409,
            "တခြား Admin က ထုတ်ပြန်ပြီးဖြစ်သည်။ JSON backup ထုတ်ထားပြီး နောက်ဆုံးဒေတာကို ပြန်ဖွင့်ပါ။",
          );
        throw error;
      }
      return respond(res, { revision: data });
    }
    if (body.action === "load-draft") {
      const { data, error } = await client
        .from("catalog_drafts")
        .select("document")
        .eq("id", "main")
        .maybeSingle();
      if (error) throw error;
      return respond(res, { document: data?.document || null });
    }
    if (body.action === "versions") {
      const { data, error } = await client
        .from("catalog_releases")
        .select("revision,created_at")
        .order("revision", { ascending: false })
        .limit(50);
      if (error) throw error;
      return respond(res, { versions: data });
    }
    if (body.action === "restore") {
      if (!Number.isSafeInteger(body.revision) || body.revision < 1)
        return fail(res, 400, "ဗားရှင်း မမှန်ပါ");
      const { data, error } = await client
        .from("catalog_releases")
        .select("document")
        .eq("revision", body.revision)
        .single();
      if (error) throw error;
      return respond(res, { document: data.document });
    }
    return fail(res, 400, "လုပ်ဆောင်ချက် မမှန်ပါ");
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "AUTH" || code === "DENIED")
      return fail(res, 403, "ဝင်ခွင့် မရှိပါ");
    if (code === "CONFIG") return fail(res, 503, "ဆာဗာ ချိတ်ဆက်မှု မပြီးသေးပါ");
    if (code === "SIZE") return fail(res, 413, "ဖိုင် အရွယ်အစား ကျော်နေသည်");
    return fail(res, 400, "ဒေတာကို စစ်ဆေးပါ။ လုပ်ဆောင်မှု မအောင်မြင်ပါ။");
  }
}
