import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const out = "/workspace/screenshots";

async function lookup(page, { year, make, model }) {
  await page.getByLabel(/Cart year/i).fill(String(year ?? ""));
  await page.getByLabel(/Cart make/i).fill(make);
  await page.getByLabel(/Cart model/i).fill(model);
  await page.getByTestId("find-cart").click();
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(BASE, { waitUntil: "networkidle" });
await lookup(page, { year: "2011", make: "Club Car", model: "Precedent" });
await page.getByTestId("cart-match").waitFor({ state: "visible" });
const packId = await page.getByTestId("cart-match").getAttribute("data-pack-id");
const matchText = await page.getByTestId("cart-match").innerText();
const picker = await page.getByRole("button", { name: /Precedent Excel|Precedent gasoline|DS IQ/i }).count();
console.log("2011 Precedent pack", packId);
console.log("2011 Precedent has picker list", picker);
console.log("2011 Precedent names IQ", /Precedent IQ/i.test(matchText));
await page.screenshot({ path: `${out}/qa-lookup-2011-precedent.png` });

await page.getByRole("button", { name: /Cart$/ }).click().catch(() => {});
await page.getByRole("button", { name: /^1 · Cart/ }).click().catch(() => {});
await page.getByLabel(/Cart year/i).fill("1995");
await page.getByLabel(/Cart make/i).fill("Club Car");
await page.getByLabel(/Cart model/i).fill("Precedent");
await page.getByTestId("find-cart").click();
await page.getByTestId("cart-no-match").waitFor({ state: "visible" });
const none = await page.getByTestId("cart-no-match").innerText();
console.log("1995 no-match", /no exact match/i.test(none), /2004/.test(none));
await page.screenshot({ path: `${out}/qa-lookup-nomatch.png` });

await page.getByLabel(/Cart year/i).fill("2020");
await page.getByLabel(/Cart make/i).fill("Club Car");
await page.getByLabel(/Cart model/i).fill("Tempo");
await page.getByTestId("find-cart").click();
await page.getByTestId("cart-match").waitFor({ state: "visible" });
const tempoId = await page.getByTestId("cart-match").getAttribute("data-pack-id");
const hasQ = (await page.getByTestId("cart-question").count()) > 0;
console.log("2020 Tempo pack", tempoId, "question", hasQ);
await page.screenshot({ path: `${out}/qa-lookup-2020-tempo.png` });

if (errors.length) console.log("PAGE ERRORS", errors);
else console.log("no page errors");
await browser.close();
if (!packId || packId !== "club-car-precedent-iq") process.exit(1);
if (picker > 0) process.exit(1);
if (!/no exact match/i.test(none)) process.exit(1);
if (tempoId !== "club-car-tempo-eric" || !hasQ) process.exit(1);
