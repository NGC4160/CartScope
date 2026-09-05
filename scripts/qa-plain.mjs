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
await page.getByRole("button", { name: /Job header/i }).click();
await page.getByRole("button", { name: /Start checks/i }).click();
const headerEmpty = await page.innerText("body");
console.log("header missing last name", /Customer last name is required/.test(headerEmpty));
console.log("header missing hcp", /Housecall Pro job number is required/.test(headerEmpty));
console.log("header missing battery", /Battery type is required/.test(headerEmpty));
await page.getByLabel(/Customer last name/i).fill("Smith");
await page.getByLabel(/Housecall Pro job number/i).fill("17411");
await page.getByRole("button", { name: /^Lead-acid$/i }).click();
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/qa-plain-bench.png` });
const body = await page.innerText("body");
console.log("has pack", /Check the pack before you blame other parts/.test(body));
console.log("has battery volts field", /Battery 1 resting volts/.test(body));
console.log("has in-flow", /ON THIS CHECK|What you see/.test(body));
console.log("has manuals first", /Manuals first/.test(body));
console.log("has helper", /Helper|What you see|More helper chat/.test(body));
console.log("no speed box slang", !/speed box|speedbox|clicker|big click switch/i.test(body));
console.log("bench snippet", body.slice(0, 800).replace(/\s+/g, " "));

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/qa-plain-bench-mobile.png` });

await browser.close();
console.log("done");
