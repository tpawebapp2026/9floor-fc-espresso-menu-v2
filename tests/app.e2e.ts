import { getClearProcedure } from "../src/clearProcedure";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync("public/recipes.json", "utf8"));
test("global top search ignores category and department, preserves query on back, and displays trial quality", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const search = page.getByRole("searchbox");
  await expect(search).toBeVisible();
  const box = await search.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(310);
  await expect(search).toHaveAttribute(
    "placeholder",
    "မီနူးအမည်၊ ပါဝင်ပစ္စည်း၊ အရသာ ရှာရန်…",
  );
  await page
    .getByRole("combobox", { name: "အမျိုးအစား ရွေးရန်" })
    .selectOption("category-01");
  await search.fill("lychee");
  await expect(page.locator(".recipe-card")).toHaveCount(9);
  await search.fill("NEW-01");
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page.locator(".card-open").click();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Iced Oreo Latte",
  );
  await expect(page.getByTestId("ingredient-total")).toContainText("382 g");
  await expect(
    page.getByRole("heading", { name: "Flavor Profile — အရသာညွှန်းကိန်း" }),
  ).toBeVisible();
  await expect(page.locator(".detail-photo .photo-unavailable")).toContainText(
    "ပုံအစစ်",
  );
  await page
    .getByRole("navigation", { name: "ဖျော်နည်းအပိုင်း ရွေးရန်" })
    .getByRole("button", { name: "ဖျော်နည်း", exact: true })
    .click();
  await expect(page.locator("#recipe-steps h2")).toBeInViewport();
  await page.getByRole("button", { name: "← မီနူးများသို့ ပြန်ရန်" }).click();
  await expect(search).toHaveValue("NEW-01");
  await page.getByRole("button", { name: "ရှာထားသောစာ ဖျက်ရန်" }).click();
  await expect(search).toHaveValue("");
  await search.fill("zzzxqnoresult");
  await expect(page.locator(".empty")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("every migrated menu opens the correct detail page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".recipe-card")).toHaveCount(166);
  for (const recipe of seed.recipes) {
    await page.goto("/recipe/" + recipe.id);
    await expect(page.locator(".detail-heading h1")).toHaveText(
      recipe.englishName,
    );
    await expect(page.locator(".ingredient")).toHaveCount(
      recipe.ingredients.length,
    );
    await expect(page.locator(".step")).toHaveCount(
      getClearProcedure(recipe).length,
    );
  }
});
test("mobile search, departments, international, favorites, recent and theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".recipe-card")).toHaveCount(166);
  await page.getByRole("searchbox").fill("21-02");
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Vietnamese Egg Coffee အကြိုက်ဆုံး",
      exact: true,
    })
    .click();
  await page.locator(".card-open").click();
  await expect(page.locator(".safety")).toBeVisible();
  await page.getByRole("button", { name: "← မီနူးများသို့ ပြန်ရန်" }).click();
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: /အအေးစုံလိုင်း/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(127);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "နိုင်ငံတကာ" })
    .click();
  await page.getByRole("button", { name: /🇻🇳/ }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(4);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "အကြိုက်ဆုံး" })
    .click();
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "အလင်းအမှောင် ပြောင်းရန်" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("offline shell and recipes survive reload; newer sync wins", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator(".recipe-card")).toHaveCount(166);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator(".recipe-card")).toHaveCount(166);
  const failures: string[] = [];
  page.on("requestfailed", (r) =>
    failures.push(r.url() + " " + r.failure()?.errorText),
  );
  page.on("pageerror", (e) => failures.push(e.message));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".recipe-card"))
    .toHaveCount(166)
    .catch(async (e) => {
      console.log(
        "OFFLINE DIAGNOSTIC",
        JSON.stringify(failures),
        await page.evaluate(async () => ({
          html: document.documentElement.outerHTML.slice(0, 1500),
          caches: await caches.keys(),
        })),
      );
      throw e;
    });
  await page.getByRole("searchbox").fill("jasmine");
  await page.locator(".card-open").first().click();
  await expect(page.locator(".detail-heading h1")).toContainText("Jasmine");
  await context.setOffline(false);
  const changed = structuredClone(seed);
  changed.revision = 7;
  changed.recipes[0].englishName = "Published update test";
  await page.route("**/recipes.json", (route) =>
    route.fulfill({ json: changed }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.goto("/recipe/" + seed.recipes[0].id);
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Published update test",
  );
  await page.unroute("**/recipes.json");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Published update test",
  );
});
test("admin fails closed without a configured database", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "ဝင်မည်", exact: true }),
  ).toBeDisabled();
});
test("local service worker A/B update requests approval and keeps favorites", async ({
  page,
}) => {
  const fs = await import("node:fs/promises");
  const original = await fs.readFile("dist/sw.js", "utf8");
  try {
    await page.goto("/");
    await expect(page.locator(".recipe-card")).toHaveCount(166);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator(".recipe-card")).toHaveCount(166);
    await page.locator(".favorite").first().click();
    const id = String(Date.now());
    await fs.writeFile(
      "dist/sw.js",
      original.replace(/const VERSION="[^"]+"/, `const VERSION="test-${id}"`),
    );
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    await expect(page.locator(".update")).toBeVisible({ timeout: 30000 });
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "ယခု Update လုပ်မည် ↻" }).click(),
    ]);
    await expect(page.locator(".update")).toHaveCount(0);
    await expect(page.locator(".favorite").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  } finally {
    await fs.writeFile("dist/sw.js", original);
  }
});
test("layout screenshots and no horizontal overflow at common sizes", async ({
  page,
}) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1100 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator(".recipe-card")).toHaveCount(166);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `/tmp/9floor-${size.width}.png` });
  }
});
test("new bundled seed upgrades cached offline recipes while old seed cannot undo it", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".recipe-card")).toHaveCount(166);
  const updated = structuredClone(seed);
  updated.seedVersion = (seed.seedVersion ?? 0) + 1;
  updated.recipes[0].englishName = "Updated bundled recipe";
  await page.route("**/recipes.json", (r) => r.fulfill({ json: updated }));
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.goto("/recipe/" + seed.recipes[0].id);
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Updated bundled recipe",
  );
  await page.unroute("**/recipes.json");
  await page.reload();
  await expect(page.locator(".detail-heading h1")).toHaveText(
    "Updated bundled recipe",
  );
});
