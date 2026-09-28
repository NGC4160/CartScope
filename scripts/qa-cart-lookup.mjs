import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const out = "/workspace/screenshots";

async function lookup(page, { year, make, model }) {
  await page.getByLabel(/Cart year/i).fill(String(year ?? ""));
  await page.getByLabel(/Cart make/i).fill(make);
  await page.getByLabel(/Cart model/i).fill(model);
  await page.getByTestId("find-cart").click();
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
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
const matchBox = await page.getByTestId("cart-match").boundingBox();
console.log("2011 Precedent pack", packId);
console.log("2011 Precedent has picker list", picker);
console.log("2011 Precedent names IQ", /Precedent IQ/i.test(matchText));
console.log("2011 match top", matchBox?.y, "in view", Boolean(matchBox && matchBox.y < 800));
await page.screenshot({ path: `${out}/qa-lookup-2011-precedent.png` });
if (packId !== "club-car-precedent-iq" || picker > 0) fail("2011 Precedent did not open IQ alone");

await page.getByTestId("use-cart").click();
await page.getByRole("button", { name: /will not run|won't run|no power|dead/i }).first().waitFor({ state: "visible" });
const cartList = await page.getByRole("button", { name: /Precedent Excel|Precedent IQ|Tempo ERIC/i }).count();
console.log("after use-cart complaint list, leftover cart picker", cartList);
await page.screenshot({ path: `${out}/qa-lookup-2011-complaint.png` });
if (cartList > 0) fail("cart picker appeared after Use this cart");
await page.getByRole("button", { name: /^1 · Cart|^Cart$/ }).first().click();

await lookup(page, { year: "1995", make: "Club Car", model: "Precedent" });
await page.getByTestId("cart-no-match").waitFor({ state: "visible" });
const none = await page.getByTestId("cart-no-match").innerText();
console.log("1995 no-match", /no exact match/i.test(none), /2004/.test(none));
await page.screenshot({ path: `${out}/qa-lookup-nomatch.png` });
if (!/no exact match/i.test(none) || !/2004/.test(none)) fail("1995 no-match copy wrong");

await lookup(page, { year: "2020", make: "Club Car", model: "Tempo" });
await page.getByTestId("cart-match").waitFor({ state: "visible" });
const tempoId = await page.getByTestId("cart-match").getAttribute("data-pack-id");
const hasQ = (await page.getByTestId("cart-question").count()) > 0;
console.log("2020 Tempo pack", tempoId, "question", hasQ);
await page.screenshot({ path: `${out}/qa-lookup-2020-tempo.png` });
if (tempoId !== "club-car-tempo-eric" || !hasQ) fail("2020 Tempo missing gas/electric question");

const more = [
  { year: "2015", make: "Club Car", model: "Precedent", id: "club-car-precedent-eric" },
  { year: "2008", make: "EZ-GO", model: "TXT", id: "ezgo-txt-tct" },
  { year: "2021", make: "Yamaha", model: "Drive2", id: "yamaha-ydre-ac" },
];
for (const row of more) {
  await lookup(page, row);
  await page.getByTestId("cart-match").waitFor({ state: "visible" });
  const id = await page.getByTestId("cart-match").getAttribute("data-pack-id");
  const q = await page.getByTestId("cart-question").count();
  console.log(`${row.year} ${row.make} ${row.model}`, id, "question", q > 0);
  if (id !== row.id || q > 0) fail(`${row.year} ${row.model} resolved wrong`);
}

await page.getByRole("link", { name: /wire picture/i }).first().click();
await page.waitForURL(/\/wiring\//);
console.log("opened wiring", page.url());
await page.screenshot({ path: `${out}/qa-lookup-wiring.png` });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
mobile.on("pageerror", (e) => errors.push(e.message));
await mobile.goto(BASE, { waitUntil: "networkidle" });
await lookup(mobile, { year: "2011", make: "Club Car", model: "Precedent" });
await mobile.getByTestId("cart-match").waitFor({ state: "visible" });
await mobile.getByTestId("cart-match").scrollIntoViewIfNeeded();
const mobileId = await mobile.getByTestId("cart-match").getAttribute("data-pack-id");
console.log("mobile 2011 pack", mobileId);
await mobile.screenshot({ path: `${out}/qa-lookup-2011-mobile.png` });
await mobile.close();
if (mobileId !== "club-car-precedent-iq") fail("mobile 2011 did not open IQ");

if (errors.length) {
  console.log("PAGE ERRORS", errors);
  fail("page errors");
} else {
  console.log("no page errors");
}
await browser.close();
