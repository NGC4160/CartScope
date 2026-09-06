import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:8080";
const out = "/workspace/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function fillHeader(page, { last, job, year, battery, complaint, serial, who }) {
  await page.getByLabel(/Customer last name/i).fill(last);
  await page.getByLabel(/Housecall Pro job number/i).fill(job);
  await page.getByLabel(/^Year$/i).fill(year);
  if (who) {
    const whoBox = page.getByLabel(/Who checked it/i);
    if (await whoBox.count()) await whoBox.fill(who);
  }
  if (serial) await page.getByLabel(/Serial/i).fill(serial);
  if (complaint) await page.getByLabel(/Short complaint note/i).fill(complaint);
  if (battery) {
    await page.getByRole("button", { name: battery, exact: true }).click();
  }
}

async function startIqJob(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /Club Car/i }).click();
  await page.getByRole("button", { name: /DS IQ/i }).first().click();
  await page.getByRole("button", { name: /Cart does not run/i }).first().click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last: "Bayux",
    job: "HCP-5501",
    year: "2006",
    battery: "Lead-acid",
    serial: "IQBAY01",
    who: "Ryan",
    complaint: "No run in the bay.",
  });
  await page.getByRole("button", { name: /Start checks/i }).click();
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
}

const fails = [];
function check(name, ok, extra = "") {
  console.log(ok ? `PASS ${name}` : `FAIL ${name} ${extra}`);
  if (!ok) fails.push(name);
}

async function runAt(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE", m.text());
  });

  await startIqJob(page);
  const dock = page.getByTestId("bay-dock");
  check(`${tag} dock visible`, await dock.isVisible());
  check(`${tag} dock Checks`, await dock.getByRole("tab", { name: "Checks" }).isVisible());
  check(`${tag} dock Diagram`, await dock.getByRole("tab", { name: "Diagram" }).isVisible());
  check(`${tag} dock Helper`, await dock.getByRole("tab", { name: "Helper" }).isVisible());
  check(`${tag} dock Report`, await dock.getByRole("tab", { name: "Report" }).isVisible());

  const save = page.getByTestId("bay-action-bar").getByRole("button", { name: /Save pack and go on/i });
  check(`${tag} sticky save visible`, await save.isVisible());
  const saveBox = await save.boundingBox();
  check(`${tag} sticky save on screen`, Boolean(saveBox && saveBox.y + saveBox.height <= height + 2), JSON.stringify(saveBox));
  check(`${tag} tap target >= 44`, Boolean(saveBox && saveBox.height >= 44), String(saveBox?.height));
  check(`${tag} pack chip`, await page.getByTestId("bay-action-bar").getByText("Pack", { exact: true }).isVisible());

  const firstVolt = page.getByRole("textbox", { name: /^Battery 1 resting volts/i });
  await firstVolt.fill("8.30");
  check(`${tag} typed 8.30`, (await firstVolt.inputValue()) === "8.30");

  if (width >= 900) {
    check(`${tag} split diagram`, await page.getByTestId("bay-diagram").isVisible());
    check(`${tag} no overlay`, (await page.getByTestId("bay-diagram-overlay").count()) === 0);
  } else {
    check(`${tag} no split diagram yet`, (await page.getByTestId("bay-diagram").count()) === 0 || !(await page.getByTestId("bay-diagram").isVisible()));
    await dock.getByRole("tab", { name: "Diagram" }).click();
    await page.getByTestId("bay-diagram-overlay").waitFor({ state: "visible" });
    check(`${tag} overlay open`, await page.getByTestId("bay-diagram-overlay").isVisible());
    await page.screenshot({ path: `${out}/bay-${tag}-diagram.png` });
    await page.getByRole("button", { name: /Done — same check/i }).click();
    await page.getByTestId("bay-diagram-overlay").waitFor({ state: "hidden" });
  }

  await dock.getByRole("tab", { name: "Helper" }).click();
  await page.getByTestId("bay-helper-sheet").waitFor({ state: "visible" });
  check(`${tag} helper sheet`, await page.getByTestId("bay-helper-sheet").isVisible());
  check(`${tag} save still visible with helper`, await save.isVisible());
  await page.getByTestId("bay-helper-sheet").getByRole("button", { name: /^Close$/i }).click();

  await dock.getByRole("tab", { name: "Report" }).click();
  await page.getByText(/Report peek|Report draft/i).first().waitFor();
  check(`${tag} report peek`, await page.getByText(/Bayux/).first().isVisible());
  await page.screenshot({ path: `${out}/bay-${tag}-report.png` });
  await page.getByRole("button", { name: /Back to checks/i }).first().click();
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
  check(`${tag} same pack after peek`, (await firstVolt.inputValue()) === "8.30");

  await dock.getByRole("tab", { name: "Diagram" }).click();
  if (width < 900) {
    await page.getByRole("button", { name: /Done — same check/i }).click();
  } else {
    await dock.getByRole("tab", { name: "Checks" }).click();
  }
  check(`${tag} value after diagram`, (await firstVolt.inputValue()) === "8.30");

  await page.screenshot({ path: `${out}/bay-${tag}-checks.png` });
  await page.close();
}

async function runFactoryCheck() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /Club Car/i }).click();
  await page.getByRole("button", { name: /DS \/ Villager FE290/ }).click();
  await page.getByRole("button", { name: /Engine will not crank/i }).click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last: "Gasbay",
    job: "HCP-5502",
    year: "2008",
    serial: "GFE29011",
    who: "Ryan",
    complaint: "No crank.",
  });
  await page.getByRole("button", { name: /Start checks/i }).click();
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByText(/CHECK 1/i).first().waitFor();
  const chip = page.getByTestId("bay-action-bar").getByText(/Check 1 of /i);
  check("factory check chip", await chip.isVisible(), await chip.innerText().catch(() => ""));
  check(
    "factory save label",
    await page.getByTestId("bay-action-bar").getByRole("button", { name: /Save and go on/i }).isVisible(),
  );
  const seePic = page.getByRole("button", { name: /See wire picture/i });
  if (await seePic.count()) await seePic.click();
  check("factory diagram split", await page.getByTestId("bay-diagram").isVisible());
  await page.screenshot({ path: `${out}/bay-tablet-factory.png` });
  await page.close();
}

await runAt(1024, 768, "tablet");
await runAt(390, 844, "phone");
await runFactoryCheck();

await browser.close();
if (fails.length) {
  console.error("FAILED", fails.join(", "));
  process.exit(1);
}
console.log("ALL BAY UX CHECKS PASSED");
