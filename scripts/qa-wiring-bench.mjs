import { chromium } from "playwright";
const base = "http://127.0.0.1:8080";
const shot = (n) => `/workspace/screenshots/${n}.png`;
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Club Car/ }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Precedent IQ/ }).click();
await page.waitForTimeout(250);
const symptoms = page.locator("button").filter({ hasText: /Will not|No |Dead|Slow/ });
console.log("symptoms", await symptoms.count());
if (await symptoms.count()) await symptoms.first().click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Open bench/i }).click();
await page.waitForURL("**/bench/**", { timeout: 8000 });
await page.waitForTimeout(800);
await page.screenshot({ path: shot("qa-bench-assistant") });
const text = await page.innerText("body");
console.log("bench has assistant", text.includes("Describe what"));
console.log("bench has wiring btn", text.includes("Wiring diagrams"));

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + "/wiring", { waitUntil: "networkidle" });
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: shot("qa-wiring-library-mobile") });
await mobile.goto(base + "/wiring/club-car-precedent-iq", { waitUntil: "networkidle" });
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: shot("qa-wiring-iq-mobile") });
await mobile.goto(base + "/wiring/ezgo-pds-36", { waitUntil: "networkidle" });
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: shot("qa-wiring-pds-mobile") });
console.log("mobile overflow", await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2));

await browser.close();
console.log("done");
