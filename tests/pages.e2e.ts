import { test, expect } from "@playwright/test";
import { countries } from "../src/international";
import { readFileSync } from "node:fs";
const photoCatalog = JSON.parse(
  readFileSync("src/photos/catalog.json", "utf8"),
) as {
  photos: Record<string, { small: { file: string }; large: { file: string } }>;
};
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.VITE_BASE_PATH || "/9floor-fc-espresso-menu-v2/";
test("international cold menus expose six styles, existing country links and correct detail routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./");
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: "နိုင်ငံတကာစတိုင်", exact: true })
    .click();
  await page
    .locator(".world-lines")
    .getByRole("button", { name: /အအေးစုံ/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(110);
  const styles = page.locator(".cold-style-grid button");
  await expect(styles).toHaveCount(7);
  for (let i = 1; i < 7; i++) {
    await styles.nth(i).click();
    expect(await page.locator(".recipe-card").count()).toBeGreaterThan(0);
  }
  await page
    .locator(".country-grid")
    .getByRole("button", { name: /🇮🇹/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(9);
  await page.getByRole("searchbox").fill("Mango Soda");
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page.locator(".card-open").click();
  await expect(page.locator(".detail-heading h1")).toHaveText("Mango Soda");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("locally hosted reference photographs load, carry credits and survive an offline detail reload", async ({
  page,
  context,
  request,
}) => {
  for (const photo of Object.values(photoCatalog.photos))
    for (const variant of [photo.small, photo.large]) {
      const response = await request.get(variant.file);
      expect(response.status(), variant.file).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/webp");
    }
  expect((await request.get("photo-credits.html")).status()).toBe(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.goto("./#/recipe/v8-01-09");
  const image = page.locator(".detail-photo img");
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(page.locator(".photo-credit")).toContainText("Dredre Lovee");
  await expect(page.locator(".photo-credit")).toContainText("CC BY-SA 4.0");
  await context.setOffline(true);
  await page.reload();
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "/tmp/9floor-real-photo-mobile.png",
    fullPage: false,
  });
});
test("unavailable photographs show a clear text fallback without a cartoon or broken image", async ({
  page,
}) => {
  await page.route("**/photos/iced-americano-*", (r) =>
    r.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("./#/recipe/v8-01-01");
  await expect(page.locator(".detail-photo .photo-unavailable")).toBeVisible();
  await expect(page.locator(".detail-photo img")).toHaveCount(0);
});
test("portrait and tablet headers keep all four full navigation labels visible and usable", async ({
  page,
}) => {
  await page.goto("./");
  const nav = page.getByRole("navigation", { name: "အဓိကမီနူး" });
  for (const width of [320, 360, 390, 430, 600, 650, 768, 900]) {
    await page.setViewportSize({ width, height: 844 });
    for (const label of [
      "မီနူးစာအုပ်",
      "နိုင်ငံတကာစတိုင်",
      "အကြိုက်ဆုံး ♡",
      "အခြေခံပြင်ဆင်မှု",
    ]) {
      const button = nav.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box, `${width}: ${label}`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await nav
      .getByRole("button", { name: "နိုင်ငံတကာစတိုင်", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "နိုင်ငံတကာ နာမည်ကြီးစတိုင်များ",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".country-grid button")).toHaveCount(
      countries.length + 1,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/9floor-portrait-navigation.png",
    fullPage: false,
  });
});
test("Pages reader serves all menus under its repository path with a scoped manifest", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".recipe-card")).toHaveCount(161);
  await page.getByRole("button", { name: /အအေးစုံလိုင်း/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(110);
  await expect(
    page.getByRole("button", { name: /စီမံခန့်ခွဲသူ ဝင်ရန်/ }),
  ).toHaveCount(0);
  const manifest = await (await request.get("manifest.webmanifest")).json();
  expect(manifest.scope).toBe(base);
  expect(manifest.start_url).toBe(base);
  expect(manifest.icons[0].src).toBe(base + "icon-192.png");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Pages deep recipe links reload online and offline without a server rewrite", async ({
  page,
  context,
}) => {
  await page.goto("./#/recipe/v9-iced-cappuccino");
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Cappuccino",
  );
  await expect(page.locator(".ingredient")).toHaveCount(6);
  await page.evaluate(() => navigator.serviceWorker.ready);
  const deployedVersion = JSON.parse(
    await readFile("dist/version.json", "utf8"),
  ).version;
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Cappuccino",
  );
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
  ).toContain(base + "sw.js?v=" + encodeURIComponent(deployedVersion));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Cappuccino",
  );
  await expect(page.locator(".step")).toHaveCount(16);
});
test("Pages cache-busted recipe requests receive a newer seed and resist an older one", async ({
  page,
}) => {
  const seed = JSON.parse(await readFile("dist/recipes.json", "utf8"));
  const updated = structuredClone(seed);
  updated.seedVersion += 100;
  updated.recipes[0].englishName = "Pages updated recipe";
  await page.goto("./");
  await expect(page.locator(".recipe-card")).toHaveCount(161);
  await page.route("**/recipes.json?check=*", (r) =>
    r.fulfill({ json: updated }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.goto("./#/recipe/" + seed.recipes[0].id);
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Pages updated recipe",
  );
  await page.unroute("**/recipes.json?check=*");
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Pages updated recipe",
  );
});
test("Pages discovers a changed deployment manifest and activates the new scoped worker", async ({
  page,
}) => {
  const sw = await readFile("dist/sw.js", "utf8"),
    manifest = await readFile("dist/version.json", "utf8");
  try {
    await page.goto("./");
    await expect(page.locator(".recipe-card")).toHaveCount(161);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator(".recipe-card")).toHaveCount(161);
    await page.locator(".favorite").first().click();
    const version = "pages-test-" + Date.now();
    await writeFile(
      "dist/sw.js",
      sw.replace(/const VERSION="[^"]+"/, `const VERSION="${version}"`),
    );
    await writeFile("dist/version.json", JSON.stringify({ version }));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".update")).toBeVisible({ timeout: 30000 });
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "ယခု Update လုပ်မည် ↻" }).click(),
    ]);
    await expect(page.locator(".favorite").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    ).toContain("?v=" + version);
  } finally {
    await writeFile("dist/sw.js", sw);
    await writeFile("dist/version.json", manifest);
  }
});

test("all four preparation groups open the correct new recipes and preserve favorites through offline reload", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".recipe-card")).toHaveCount(161);
  await page.locator(".favorite").first().click();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: /အခြေခံ/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(12);
  await page.screenshot({
    path: "/tmp/9floor-preparations-mobile.png",
    fullPage: true,
  });
  const seed = JSON.parse(await readFile("public/recipes.json", "utf8"));
  for (const group of ["Syrup", "Sauce", "Fruit Concentrate", "Fruit Purée"]) {
    await page
      .locator(".preparation-groups")
      .getByRole("button", { name: new RegExp(group) })
      .click();
    await expect(page.locator(".recipe-card")).toHaveCount(3);
  }
  for (const r of seed.recipes.filter((r: any) => r.id.startsWith("prep-"))) {
    await page.goto("./#/recipe/" + r.id);
    await expect(page.locator(".detail-heading h1")).toHaveText(r.englishName);
    await expect(page.locator(".ingredient")).toHaveCount(r.ingredients.length);
    await expect(page.locator(".step")).toHaveCount(r.steps.length);
    await expect(page.locator(".density-panel")).toBeVisible();
  }
  await page.goto("./#/recipe/prep-simple-syrup");
  await page
    .getByRole("combobox", { name: "Batch အရေအတွက်", exact: true })
    .selectOption("2");
  await expect(page.locator(".ingredient").nth(1)).toContainText(
    "600 g ≈ 601 ml",
  );
  await expect(page.locator(".density-result")).toContainText("Sample g / ml");
  await page
    .getByLabel("Sample အသားတင်အလေးချိန် (g)", { exact: true })
    .fill("123");
  await expect(page.locator(".density-result")).toContainText("30 ml ≈ 36.9 g");
  await page
    .getByLabel("ပြောင်းမည့်ဦးတည်ချက်", { exact: true })
    .selectOption("g-to-ml");
  await page.getByLabel("ပြောင်းမည့်ပမာဏ", { exact: true }).fill("36.9");
  await expect(page.locator(".density-result")).toContainText("36.9 g ≈ 30 ml");
  await page.screenshot({
    path: "/tmp/9floor-density-mobile.png",
    fullPage: true,
  });
  await page.getByLabel("Sample ပမာဏ (ml)", { exact: true }).fill("0");
  await expect(page.locator(".density-result")).not.toContainText("Infinity");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Simple Syrup 1:1 (by weight)",
  );
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: /အကြိုက်ဆုံး/ })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Iced Americano အကြိုက်ဆုံး",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("mobile Matcha discovery, country style filters and detailed related recipes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("searchbox").fill("Matcha");
  await expect(page.locator(".recipe-card")).toHaveCount(10);
  await page.getByRole("button", { name: /Matcha သီးသန့်ကြည့်ရန်/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(10);
  await page
    .locator(".matcha-styles")
    .getByRole("button", { name: /ထိုင်း/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page.locator(".card-open").click();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Thai-Style Matcha Milk",
  );
  await expect(page.locator(".step")).toHaveCount(11);
  await page.locator(".related-procedure summary").click();
  await page
    .locator(".related-procedure button")
    .filter({ hasText: "Iced Matcha Latte" })
    .first()
    .click();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Matcha Latte",
  );
  await expect(page.locator(".original-procedure")).toBeVisible();
});
