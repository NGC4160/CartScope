import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const shot = (name) => `/workspace/screenshots/${name}.png`;

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});

await page.goto(base + "/wiring", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("qa-wiring-library") });
console.log("library title", await page.locator("h1").innerText());
console.log("model cards", await page.locator("a[href*='/wiring/']").count());

await page.getByRole("link", { name: /Precedent IQ/ }).first().click();
await page.waitForURL("**/wiring/club-car-precedent-iq");
await page.waitForTimeout(1200);
await page.screenshot({ path: shot("qa-wiring-iq") });
const imgs = await page.locator("img").evaluateAll((els) =>
  els.map((e) => ({
    alt: e.alt,
    w: e.naturalWidth,
    h: e.naturalHeight,
    complete: e.complete,
    vis: getComputedStyle(e).visibility,
    box: e.getBoundingClientRect().toJSON(),
  })),
);
console.log("imgs", JSON.stringify(imgs, null, 2));

await page.goto(base + "/wiring/ezgo-pds-36", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: shot("qa-wiring-pds") });

await page.goto(base + "/wiring/ezgo-marathon-gas", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: shot("qa-wiring-marathon") });

await page.goto(base + "/wiring/club-car-tempo-eric", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: shot("qa-wiring-tempo") });

await page.goto(base + "/print/wiring/iq-main?modelId=club-car-precedent-iq", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: shot("qa-print-wiring") });

await page.goto(base + "/wiring/club-car-precedent-iq", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const ask = page.getByPlaceholder(/Describe what you’re seeing|Fault code/i).first();
await ask.fill("Solenoid clicks but motor doesn’t turn");
await page.getByRole("button", { name: /Ask/i }).click();
console.log("assistant sent");
await page.waitForTimeout(18000);
await page.screenshot({ path: shot("qa-assistant-iq") });
const body = await page.innerText("body");
const i = body.indexOf("Assistant");
console.log("assistant snippet", body.slice(i, i + 900));

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Club Car/ }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: /Precedent IQ/ }).click();
await page.waitForTimeout(250);
const symptom = page.getByRole("button").filter({ hasText: /Will not|No / }).first();
if (await symptom.count()) await symptom.click();
else await page.locator("button").nth(4).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Start job/i }).click();
await page.waitForURL("**/bench/**", { timeout: 8000 });
await page.waitForTimeout(800);
await page.screenshot({ path: shot("qa-bench-assistant") });
console.log("bench url", page.url());
console.log("bench has assistant", (await page.innerText("body")).includes("Describe what"));

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + "/wiring", { waitUntil: "networkidle" });
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: shot("qa-wiring-library-mobile") });
await mobile.goto(base + "/wiring/club-car-precedent-iq", { waitUntil: "networkidle" });
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: shot("qa-wiring-iq-mobile") });

await browser.close();
console.log("done");
