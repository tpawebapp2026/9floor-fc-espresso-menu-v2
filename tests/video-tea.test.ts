import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import images from "../src/videoTeaPhotos.json";
import { CatalogSchema } from "../src/model";
import { assemblyFor } from "../src/assembly";
const seed = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
const added = seed.recipes.filter(
  (r) => r.categoryId === "video-tea-refreshing",
);
it("retains all twenty source parts, both side-by-side variants and original cup sizes", () => {
  expect(added).toHaveLength(22);
  expect(new Set(Object.values(images).map((p) => p.part)).size).toBe(20);
  expect(Object.values(images).filter((p) => p.part === 13)).toHaveLength(2);
  expect(Object.values(images).filter((p) => p.part === 15)).toHaveLength(2);
  expect(seed.recipes.find((r) => r.id === "video-tea-05")!.cupSizes).toEqual([
    32,
  ]);
  expect(seed.recipes.find((r) => r.id === "video-tea-07")!.cupSizes).toEqual([
    16,
  ]);
  for (const r of added) {
    expect(r.source?.sha256).toBe(
      "77c25bec0383310113db1716cb75eb8a6ee493f7ac11b9ed5cd98a49e482f558",
    );
    expect(r.verification).toBe("source-unverified");
    expect(r.notes.join(" ")).toContain("g မဖော်ပြ");
    expect(assemblyFor(r)).not.toBeNull();
    expect(r.steps).toEqual(assemblyFor(r)!.steps.map((s) => s.text));
  }
});
it("keeps observed split soda additions, honey pre-mix and tea extraction separate", () => {
  const p = (id: string) =>
    assemblyFor(added.find((r) => r.id === "video-tea-" + id)!)!;
  expect(p("05").cupOrder[0]).toContain("90 ml");
  expect(p("05").cupOrder.at(-1)).toContain("230 ml");
  expect(p("16").cupOrder.slice(0, 2).join(" ")).toContain("50 ml");
  expect(p("16").cupOrder[1]).toContain("30 ml");
  expect(p("16").cupOrder.at(-1)).toContain("120 ml");
  expect(p("03").steps[0].produce).toBe("honey-mix");
  expect(p("03").steps[2].take).toEqual(["honey-mix"]);
  expect(p("14").steps[0].text).toContain("ရေနွေး 100 ml");
  expect(p("14").cupOrder.at(-1)).toContain("70 ml");
  expect(p("15a").steps[0].text).toContain("ရေနွေး 150 ml");
  expect(p("15a").cupOrder[2]).toContain("30 ml");
});
it("ships a unique, decodable original-video crop for every new recipe", async () => {
  expect(Object.keys(images).sort()).toEqual(added.map((r) => r.id).sort());
  expect(new Set(Object.values(images).map((p) => p.sha256)).size).toBe(22);
  for (const p of Object.values(images)) {
    const bytes = readFileSync("public/" + p.file);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(p.sha256);
    const decoded = await sharp(bytes).metadata();
    expect(decoded.format).toBe("webp");
    expect(decoded.width).toBe(Number(p.crop.split(":")[0]));
    expect(decoded.height).toBe(Number(p.crop.split(":")[1]));
    const [minute, second] = p.range.split("–")[0].split(":").map(Number);
    const [endMinute, endSecond] = p.range.split("–")[1].split(":").map(Number);
    expect(p.frameSeconds).toBeGreaterThanOrEqual(minute * 60 + second);
    expect(p.frameSeconds).toBeLessThan(endMinute * 60 + endSecond);
  }
});
