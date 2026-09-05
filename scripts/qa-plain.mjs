import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const out = "/workspace/screenshots";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});

await page.goto(BASE, { waitUntil: "networkidle" });
const home = await page.innerText("body");
console.log("home has 5th-grade", /Find the problem\. One step at a time/.test(home));
console.log("home cart checks", /CART CHECKS/.test(home));

await page.getByRole("button", { name: /Club Car/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/qa-plain-models.png` });
await page.getByRole("button", { name: /Precedent IQ/i }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/qa-plain-symptoms.png` });
const firstSymptom = page.locator("button").filter({ hasText: /Cart does not run|does not run|will not/i }).first();
await firstSymptom.click();
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/qa-plain-bench.png` });
const body = await page.innerText("body");
console.log("has CHECK", /CHECK 1/.test(body));
console.log("has helper", /Helper|Tell me what you see/.test(body));
console.log("has wire maps", /Wire maps/.test(body));
console.log("has voltage gloss", /Voltage is how strong/.test(body));
console.log("has click switch gloss", /big click switch/.test(body) || /click switch/.test(body));
console.log("has set meter", /Set your meter like this/.test(body));
console.log("bench snippet", body.slice(0, 800).replace(/\s+/g, " "));

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/qa-plain-bench-mobile.png` });

await browser.close();
console.log("done");
