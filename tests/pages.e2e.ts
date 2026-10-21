import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.VITE_BASE_PATH || "/9floor-fc-espresso-menu-v2/";
test("Pages reader serves all menus under its repository path with a scoped manifest", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".recipe-card")).toHaveCount(161);
  await page.getByRole("button", { name: /အအေးစုံလိုင်း/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(99);
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
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Cappuccino",
  );
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
  ).toContain(base + "sw.js");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Cappuccino",
  );
  await expect(page.locator(".step")).toHaveCount(9);
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
