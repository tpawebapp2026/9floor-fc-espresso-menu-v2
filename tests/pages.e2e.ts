import { getProcedure } from "../src/procedure";
import { test, expect, type Page } from "@playwright/test";
async function openMenu(page: Page) {
  if (!(await page.locator("#app-menu").isVisible()))
    await page
      .getByRole("button", { name: "Menu ဖွင့်ရန်", exact: true })
      .click();
}
import { countries } from "../src/international";
import { readFileSync } from "node:fs";
const photoCatalog = JSON.parse(
  readFileSync("src/photos/catalog.json", "utf8"),
) as {
  photos: Record<string, { small: { file: string }; large: { file: string } }>;
};
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.VITE_BASE_PATH || "/9floor-fc-espresso-menu-v2/";
test("video recipes expose all 20 parts with original frames and work offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await openMenu(page);
  await page.getByRole("button", { name: /Video Recipe · Part 01–20/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(22);
  await page.goto("./#/recipe/video-tea-05");
  await expect(page.locator(".detail-heading h1")).toContainText(
    "Thai Red Soda 32 oz",
  );
  await expect(page.locator(".ingredient").first()).toContainText("90 ml");
  await expect(page.locator(".cup-order li").last()).toContainText("230 ml");
  await expect(page.locator(".photo-credit")).toContainText("Video ထဲမှ");
  await page.goto("./#/recipe/video-tea-13b");
  const photo = page.locator(".detail-photo img");
  await expect(photo).toHaveAttribute("src", /video-tea\/part-13b.webp/);
  await expect
    .poll(() =>
      photo.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toContainText(
    "Mixed Berry Soda",
  );
  await expect
    .poll(() =>
      page
        .locator(".detail-photo img")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  await expect(page.locator(".cup-order li")).toHaveCount(4);
  await page
    .locator(".detail-layout")
    .screenshot({ path: "/tmp/9floor-video-recipe-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("international cold menus expose six styles, existing country links and correct detail routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./");
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: "နိုင်ငံတကာစတိုင်", exact: true })
    .click();
  await openMenu(page);
  await page
    .locator(".world-lines")
    .getByRole("button", { name: /အအေးစုံ/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(218);
  const styles = page.locator(".cold-style-grid button");
  await expect(styles).toHaveCount(7);
  for (let i = 1; i < 7; i++) {
    await openMenu(page);
    await styles.nth(i).click();
    expect(await page.locator(".recipe-card").count()).toBeGreaterThan(0);
  }
  await openMenu(page);
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
  await page.goto("./#/recipe/v8-01-11");
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
test.describe("mocked missing photo", () => {
  // Force a real 404 instead of racing a service-worker cached image.
  test.use({ serviceWorkers: "block" });
  test("unavailable photographs show a clear text fallback without a cartoon or broken image", async ({
    page,
  }) => {
    let intercepted = 0;
    await page.route("**/photos/iced-americano-*", (r) => {
      intercepted++;
      return r.fulfill({ status: 404, body: "missing" });
    });
    await page.goto("./#/recipe/v8-01-02");
    await expect.poll(() => intercepted).toBeGreaterThan(0);
    await expect(
      page.locator(".detail-photo .photo-unavailable"),
    ).toBeVisible();
    await expect(page.locator(".detail-photo img")).toHaveCount(0);
  });
});

test("picture gallery stays simple and the side menu is accessible on phones and tablets", async ({
  page,
}) => {
  await page.goto("./");
  const menu = page.locator("#app-menu");
  const trigger = page.getByRole("button", {
    name: "Menu ဖွင့်ရန်",
    exact: true,
  });
  const nav = page.getByRole("navigation", { name: "အဓိကမီနူး" });
  for (const width of [320, 360, 390, 430, 600, 650, 768, 900]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.locator(".hero, .bottom-nav")).toHaveCount(0);
    await expect(menu).not.toBeVisible();
    await trigger.click();
    await expect(menu).toBeVisible();
    for (const label of [
      "မီနူးစာအုပ်",
      "9 FLOOR Album",
      "နိုင်ငံတကာစတိုင်",
      "အကြိုက်ဆုံး ♡",
      "အခြေခံပြင်ဆင်မှု",
    ]) {
      const button = nav.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await nav
      .getByRole("button", { name: "နိုင်ငံတကာစတိုင်", exact: true })
      .click();
    await expect(menu).not.toBeVisible();
    await openMenu(page);
    await expect(page.locator(".section-intro h2")).toHaveText(
      "နိုင်ငံတကာ နာမည်ကြီးစတိုင်များ",
    );
    await expect(page.locator(".country-grid button")).toHaveCount(
      countries.length + 1,
    );
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await openMenu(page);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("#app-menu")),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/9floor-side-menu-mobile.png" });
  await page.mouse.click(5, 300);
  await expect(menu).not.toBeVisible();
  await page.getByRole("searchbox").fill("VC-01");
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await expect(page.locator(".card-copy").first()).toBeVisible();
  await expect(page.locator(".card-copy h3").first()).toHaveText("Black Honey");
  const image = page.locator(".recipe-card img").first();
  await expect
    .poll(() =>
      image.evaluate(
        (im: HTMLImageElement) => im.complete && im.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "/tmp/9floor-picture-gallery-mobile.png" });
  await page.locator(".card-open").click();
  await expect(page.locator(".detail-heading h1")).toContainText("Black Honey");
});
test("Pages reader serves all menus under its repository path with a scoped manifest", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".recipe-card")).toHaveCount(191);
  await openMenu(page);
  await page.getByRole("button", { name: /အအေးစုံလိုင်း/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(218);
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
  await expect(page.locator(".step")).toHaveCount(
    getProcedure(
      JSON.parse(readFileSync("public/recipes.json", "utf8")).recipes.find(
        (r: any) => r.id === "v9-iced-cappuccino",
      ),
    ).steps.length,
  );
  await expect
    .poll(() =>
      page
        .locator(".brand-logo-icon img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth === 1254,
        ),
    )
    .toBe(true);
});
test.describe("mocked catalog refresh", () => {
  // Service-worker behavior is tested separately; these routes must observe the mocked network.
  test.use({ serviceWorkers: "block" });
  test("Pages cache-busted recipe requests receive a newer seed and resist an older one", async ({
    page,
  }) => {
    const seed = JSON.parse(await readFile("dist/recipes.json", "utf8"));
    const updated = structuredClone(seed);
    updated.seedVersion += 100;
    updated.recipes[0].englishName = "Pages updated recipe";
    await page.goto("./");
    await expect(page.locator(".recipe-card")).toHaveCount(191);
    await page.route("**/recipes.json?check=*", (r) =>
      r.fulfill({ json: updated }),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.locator(".recipe-card h3").first()).toHaveText(
      "Pages updated recipe",
    );
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
});

test("Pages discovers a changed deployment manifest and activates the new scoped worker", async ({
  page,
}) => {
  const sw = await readFile("dist/sw.js", "utf8"),
    manifest = await readFile("dist/version.json", "utf8");
  try {
    await page.goto("./");
    await expect(page.locator(".recipe-card")).toHaveCount(191);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator(".recipe-card")).toHaveCount(191);
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
  await expect(page.locator(".recipe-card")).toHaveCount(191);
  await page.locator(".favorite").first().click();
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: /အခြေခံ/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(12);
  await page.screenshot({
    path: "/tmp/9floor-preparations-mobile.png",
    fullPage: true,
  });
  const seed = JSON.parse(await readFile("public/recipes.json", "utf8"));
  for (const group of ["Syrup", "Sauce", "Fruit Concentrate", "Fruit Purée"]) {
    await openMenu(page);
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
    await expect(page.locator(".step")).toHaveCount(
      getProcedure(r).steps.length,
    );
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
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
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
  await expect(page.locator(".recipe-card")).toHaveCount(40);
  await openMenu(page);
  await page.getByRole("button", { name: /Matcha သီးသန့်ကြည့်ရန်/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(39);
  await openMenu(page);
  await page
    .locator(".matcha-styles")
    .getByRole("button", { name: /ထိုင်း/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page.locator(".card-open").click();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Thai-Style Matcha Milk",
  );
  await expect(page.locator(".step")).toHaveCount(
    getProcedure(
      JSON.parse(readFileSync("public/recipes.json", "utf8")).recipes.find(
        (r: any) => r.id === "matcha-thai-milk",
      ),
    ).steps.length,
  );
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

test("Album groups, exact crop images, recipes and favorites work on mobile and offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: "9 FLOOR Album", exact: true })
    .click();
  await expect(page.locator(".section-intro h2")).toHaveText(
    "9 FLOOR COFFEE — Menu Album",
  );
  await expect
    .poll(() => page.locator(".recipe-card").count())
    .toBeGreaterThanOrEqual(55);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const images = page.locator(".recipe-card img");
  for (let i = 0; i < (await images.count()); i++) {
    await images.nth(i).evaluate(async (image: HTMLImageElement) => {
      image.loading = "eager";
      await image.decode();
    });
    await expect(images.nth(i)).toHaveCSS("object-fit", "contain");
    await expect(images.nth(i)).toHaveAttribute(
      "src",
      /^data:image\/jpeg;base64,/,
    );
  }
  const groups = page.getByRole("combobox", { name: "အမျိုးအစား ရွေးရန်" });
  await openMenu(page);
  await groups.selectOption("album-signature");
  await expect(
    page.getByRole("button", {
      name: "Iced Vanilla Latte ဖျော်နည်းကြည့်ရန်",
      exact: true,
    }),
  ).toBeVisible();
  await openMenu(page);
  await groups.selectOption("album-cream");
  await expect(page.locator(".recipe-card")).toHaveCount(5);
  await page
    .getByRole("button", {
      name: "Chocolate Oreo Cream အကြိုက်ဆုံး",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Chocolate Oreo Cream ဖျော်နည်းကြည့်ရန်",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".ingredient").filter({ hasText: "Whipping Cream" }),
  ).toContainText("35 g");
  await expect(page.locator(".photo-credit")).toContainText("9 FLOOR COFFEE");
  const cream = JSON.parse(
    readFileSync("public/recipes.json", "utf8"),
  ).recipes.find((r: any) => r.englishName === "Chocolate Oreo Cream");
  await expect(page.locator(".step")).toHaveCount(
    getProcedure(cream).steps.length,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Chocolate Oreo Cream",
  );
  await expect
    .poll(() =>
      page
        .locator(".detail-photo img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: /အကြိုက်ဆုံး/ })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Chocolate Oreo Cream အကြိုက်ဆုံး",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      String(width),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "အဓိကမီနူး" })
    .getByRole("button", { name: /9 FLOOR Album/ })
    .click();
  await openMenu(page);
  await groups.selectOption("album-cream");
  await page.screenshot({
    path: "/tmp/9floor-album-cream-mobile.png",
    fullPage: true,
  });
});

test("all recipes expose the exact vessel-specific assembly plan and retain it offline", async ({
  page,
  context,
}) => {
  test.setTimeout(240000);
  const seed = JSON.parse(readFileSync("public/recipes.json", "utf8"));
  await page.goto("./");
  for (const recipe of seed.recipes) {
    const procedure = getProcedure(recipe);
    const plan = procedure.assembly!;
    await page.goto("./#/recipe/" + recipe.id);
    await expect(page.locator(".detail-heading h1")).toHaveText(
      recipe.englishName,
    );
    await expect(page.locator(".step")).toHaveCount(plan.steps.length);
    await expect(page.locator(".step-vessel")).toHaveCount(plan.steps.length);
    await expect(page.locator(".ingredient")).toHaveCount(
      plan.ingredients.length,
    );
    if (plan.kind === "drink")
      await expect(page.locator(".cup-order li")).toHaveText(plan.cupOrder);
    else
      await expect(page.locator(".assembly-summary")).toContainText(
        "BATCH ORDER",
      );
  }
  await page.goto("./#/recipe/9f-poster-032");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".cup-order li")).toHaveCount(6);
  await expect(page.locator(".cup-order li").first()).toContainText(
    "Oreo Original 1 ချပ်",
  );
  await expect(page.locator(".cup-order li").last()).toContainText(
    "Oreo Original 1 ချပ်",
  );
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      String(width),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".assembly-procedure")
    .screenshot({ path: "/tmp/9floor-cup-order-mobile.png" });
});

test("new uploaded series expose all 75 additions, exact variants, photos and offline detail on mobile", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  for (const [name, count] of [
    [/Video Coffee · Part 01–21/, 22],
    [/Video Berry Series · Part 01–16/, 17],
    [/Video Two Tone · Part 01–14/, 16],
    [/Video Matcha · Part 01–18/, 20],
  ] as const) {
    await openMenu(page);
    await page.getByRole("button", { name }).click();
    await expect(page.locator(".recipe-card")).toHaveCount(count);
    await expect(page.locator(".recipe-card img").first()).toHaveAttribute(
      "src",
      /generated-video/,
    );
  }
  await page.goto("./#/recipe/video-series-matcha-16");
  await expect(page.locator(".detail-heading h1")).toContainText("50% Sweet");
  await expect(
    page.locator(".ingredient").filter({ hasText: "နို့ဆီ" }),
  ).toContainText("15 ml");
  await page.goto("./#/recipe/video-series-matcha-18");
  await expect(page.locator(".detail-heading h1")).toContainText("Biscoff");
  await expect(page.locator(".photo-credit")).toContainText("Matcha");
  const photo = page.locator(".detail-photo img");
  await expect
    .poll(() =>
      photo.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toContainText("Biscoff");
  await expect
    .poll(() =>
      photo.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
