import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BAY_QA_BASE || "http://127.0.0.1:8080";
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

async function startIqJob(page, who = "Ryan") {
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
    who,
    complaint: "No run in the bay.",
  });
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
}

const fails = [];
function check(name, ok, extra = "") {
  console.log(ok ? `PASS ${name}` : `FAIL ${name} ${extra}`);
  if (!ok) fails.push(name);
}

/** Helper jump still keeps a reserved lower-right pad. Save/Start do not. */
async function installLiveChrome(page) {
  await page.evaluate(() => {
    if (document.getElementById("grok-pill-sim")) return;
    const el = document.createElement("div");
    el.id = "grok-pill-sim";
    el.setAttribute("data-testid", "grok-pill-sim");
    el.style.cssText =
      "position:fixed;right:0;bottom:0;z-index:2147483647;width:11.5rem;height:5rem;background:rgba(20,20,20,0.55);pointer-events:auto;border-radius:12px 0 0 0;";
    document.body.appendChild(el);
  });
}

/**
 * Live pack miss: scroll the long pack form, then tap the RIGHT of Save
 * where the Grok chat pill sits. Click lands on the pill; Save must still run.
 */
async function gloveTapPrimary(page) {
  await installLiveChrome(page);
  await page.evaluate(() => {
    const form = document.getElementById("bay-check-form");
    const scroller = form?.querySelector("[class*='overflow-auto']") ?? form;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  const bar = page.getByTestId("bay-action-bar");
  const btn = bar.getByTestId("bay-primary-action").filter({ visible: true });
  await btn.waitFor({ state: "visible" });
  const box = await btn.boundingBox();
  if (!box) throw new Error("sticky Save button has no box");
  const x = box.x + Math.min(box.width * 0.86, box.width - 8);
  const y = box.y + box.height * 0.55;
  return { x, y };
}

async function gloveClickPrimary(page) {
  const { x, y } = await gloveTapPrimary(page);
  await page.mouse.click(x, y, { button: "left" });
}

async function gloveTouchPrimary(page) {
  const { x, y } = await gloveTapPrimary(page);
  await page.touchscreen.tap(x, y);
}

/** Tester tap: on the Save control itself, left of the Grok chat pill. */
async function mouseClickPrimary(page) {
  const bar = page.getByTestId("bay-action-bar");
  const btn = bar.getByTestId("bay-primary-action").filter({ visible: true });
  await btn.waitFor({ state: "visible" });
  const box = await btn.boundingBox();
  if (!box) throw new Error("sticky Save button has no box");
  const x = box.x + box.width * 0.4;
  const y = box.y + box.height * 0.5;
  const hit = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return { hitSave: false, start: false, tag: null };
      return {
        hitSave: Boolean(el.closest("[data-testid='bay-primary-action'], [data-testid='bay-action-bar']")),
        start: Boolean(el.closest("[data-testid='start-checks']")),
        tag: el.tagName,
        testid: el.getAttribute("data-testid"),
      };
    },
    { x, y },
  );
  if (!hit.hitSave || hit.start) {
    throw new Error(`sticky Save mouse target is not Save: ${JSON.stringify(hit)}`);
  }
  await page.mouse.click(x, y, { button: "left" });
}

/** Real mouse click on Job header Start checks — center of the control (not the Grok pill). */
async function mouseClickStart(page) {
  const btn = page.getByTestId("start-checks");
  await btn.waitFor({ state: "visible" });
  await btn.scrollIntoViewIfNeeded();
  const box = await btn.boundingBox();
  if (!box) throw new Error("Start checks has no box");
  const x = box.x + box.width * 0.4;
  const y = box.y + box.height * 0.5;
  const hit = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return {
        hitStart: Boolean(el?.closest?.("[data-testid='start-checks']")),
        tag: el?.tagName ?? null,
        testid: el?.getAttribute?.("data-testid") ?? null,
      };
    },
    { x, y },
  );
  if (!hit.hitStart) {
    throw new Error(`Start mouse target is not Start: ${JSON.stringify(hit)}`);
  }
  await page.mouse.click(x, y, { button: "left" });
}

function yearCoverSpan(text) {
  const m = String(text).match(/1991\s*[–—-]\s*\d{4}/);
  return m ? m[0].replace(/\s+/g, "") : "";
}

async function fillHandheldAndSave(page) {
  await page.getByRole("heading", { name: /Save a program file before you clear/i }).waitFor({ timeout: 10000 });
  const present = page.getByPlaceholder(/write each code/i);
  if (await present.count()) await present.fill("None");
  const history = page.getByPlaceholder(/stored code/i);
  if (await history.count()) await history.fill("None");
  const noRead = page.getByText(/This controller does not show fault counters/i);
  if (await noRead.count()) await noRead.click();
  await mouseClickPrimary(page);
  await page.getByText(/CHECK 1/i).first().waitFor({ timeout: 15000 });
}

async function saveFactoryCheck1To2(page, pickLabel, nextHeading, label) {
  await page.getByText(/CHECK 1/i).first().waitFor({ timeout: 15000 });
  const pick = page.getByRole("button", { name: pickLabel });
  await pick.waitFor({ state: "visible" });
  await pick.click();
  await mouseClickPrimary(page);
  await page.getByText(/CHECK 2/i).first().waitFor({ timeout: 10000 });
  check(`${label} sticky Save left Check 1`, await page.getByText(/CHECK 2/i).first().isVisible());
  if (nextHeading) {
    check(`${label} Check 2 heading`, await page.getByRole("heading", { name: nextHeading }).isVisible());
  }
}

async function mouseClickLocator(page, locator, label) {
  await installLiveChrome(page);
  await locator.waitFor({ state: "visible" });
  await locator.scrollIntoViewIfNeeded();
  if (label.includes("helper jump")) {
    await page.evaluate(() => {
      document.querySelector("[data-testid='helper-redirect-list']")?.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    });
  }
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${label} has no box`);
  // Live re-test taps the lower-right, next to the Grok chat pill.
  const x = label.includes("helper jump") ? box.x + box.width * 0.85 : box.x + box.width / 2;
  const y = label.includes("helper jump") ? box.y + box.height * 0.7 : box.y + box.height / 2;
  const hit = await page.evaluate(
    ({ x, y, label }) => {
      const el = document.elementFromPoint(x, y);
      return {
        label,
        tag: el?.tagName ?? null,
        testid: el?.getAttribute?.("data-testid") ?? null,
        helperJump: Boolean(el?.closest?.("[data-helper-jump]")),
        save: Boolean(el?.closest?.("[data-testid='bay-primary-action']")),
        pill: Boolean(el?.closest?.("[data-testid='grok-pill-sim']")),
      };
    },
    { x, y, label },
  );
  if (label.includes("helper jump") && (hit.save || hit.pill || !hit.helperJump)) {
    throw new Error(`helper jump mouse target is wrong: ${JSON.stringify(hit)}`);
  }
  await page.mouse.click(x, y, { button: "left" });
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
  const saveUnderHelper = await page.evaluate(() => {
    const saveEl = document.querySelector("[data-testid='bay-primary-action']");
    if (!saveEl) return { covered: true };
    const box = saveEl.getBoundingClientRect();
    const el = document.elementFromPoint(box.x + box.width * 0.85, box.y + box.height * 0.7);
    return {
      covered: Boolean(el?.closest("[data-testid='bay-helper-sheet']")),
      save: Boolean(el?.closest("[data-testid='bay-primary-action']")),
    };
  });
  check(`${tag} helper covers Save tap`, saveUnderHelper.covered && !saveUnderHelper.save, JSON.stringify(saveUnderHelper));
  const helperHeaders = page.getByTestId("bay-helper-sheet").getByText(/^HELPER$/);
  check(`${tag} single helper chrome`, (await helperHeaders.count()) === 1, String(await helperHeaders.count()));
  const sawBox = page.getByLabel(/^What you see$/i);
  await sawBox.waitFor({ state: "attached" });
  await sawBox.fill("Speed sensor fault");
  const askHelper = page.getByRole("button", { name: /Use this to pick the next check/i });
  if (await askHelper.count()) {
    await askHelper.click();
    const offline = page.getByTestId("helper-offline-reason");
    const helperReply = page.getByTestId("bay-helper-sheet").getByText(/What to do next|factory check|Factory checks|shop helper|offline/i);
    await Promise.race([
      offline.waitFor({ timeout: 12000 }).catch(() => {}),
      helperReply.waitFor({ timeout: 12000 }).catch(() => {}),
    ]);
    check(
      `${tag} helper answer or reason`,
      (await offline.count()) > 0 || (await helperReply.count()) > 0,
    );
    check(
      `${tag} no dead-end unavailable line`,
      (await page.getByText(/The helper is not available right now/i).count()) === 0,
    );
  }
  await page.screenshot({ path: `${out}/bay-${tag}-helper.png` });
  await page.getByTestId("bay-helper-sheet").getByRole("button", { name: /^Close$/i }).click();
  check(
    `${tag} observation strip`,
    await page.getByText(/What the tech saw:\s*Speed sensor fault/i).first().isVisible(),
  );

  const irUnit = page.getByRole("button", { name: /milliohms/i }).first();
  await irUnit.scrollIntoViewIfNeeded();
  check(`${tag} IR milliohms picker`, await irUnit.isVisible());
  check(`${tag} IR milliohms selected`, (await irUnit.getAttribute("aria-pressed")) === "true");
  const mega = page.getByRole("button", { name: /megaohms/i }).first();
  const irBox = page.getByLabel(/^Battery 1 internal resistance$/i);
  await irBox.fill("12.1");
  await mega.click();
  check(`${tag} IR number stays 12.1 after MΩ`, (await irBox.inputValue()) === "12.1");
  check(`${tag} IR megaohms selected`, (await mega.getAttribute("aria-pressed")) === "true");
  await irUnit.click();

  await dock.getByRole("tab", { name: "Report" }).click();
  await page.getByText(/Report peek|Report draft/i).first().waitFor();
  const checksPane = page.getByTestId("bay-checks-pane");
  check(`${tag} checks pane parked`, (await checksPane.count()) === 0 || (await checksPane.getAttribute("hidden")) !== null || !(await checksPane.isVisible()));
  check(`${tag} checks pane not hittable`, (await checksPane.count()) === 0 || !(await checksPane.isVisible()));
  check(`${tag} pack heading hidden on report`, (await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).count()) === 0 || !(await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).isVisible()));
  check(`${tag} no live check form`, (await page.locator("#bay-check-form").count()) === 0 || !(await page.locator("#bay-check-form").isVisible()));
  check(`${tag} no report checks table`, (await page.getByTestId("report-check-log").count()) === 0);
  check(`${tag} Checks tab hidden on Report`, (await dock.getByRole("tab", { name: "Checks" }).count()) === 0);
  check(`${tag} Checks tab not hittable on Report`, !(await dock.getByRole("tab", { name: "Checks" }).isVisible().catch(() => false)));
  const checksTabHit = await page.evaluate(() => {
    const dockEl = document.querySelector("[data-testid='bay-dock']");
    if (!dockEl) return { hittable: false };
    const box = dockEl.getBoundingClientRect();
    const el = document.elementFromPoint(box.x + 24, box.y + box.height / 2);
    return {
      hittable: Boolean(el?.closest("[data-bay-dock-checks], [role='tab']") && /checks/i.test(el.textContent || "")),
      text: (el?.textContent || "").trim(),
    };
  });
  check(`${tag} first dock slot is not Checks`, !checksTabHit.hittable, JSON.stringify(checksTabHit));
  const reportPane = page.getByTestId("bay-report-pane");
  check(`${tag} report pane up`, await reportPane.isVisible());
  check(
    `${tag} report pane has no Checks heading`,
    (await reportPane.getByRole("heading", { name: /^Checks$/i }).count()) === 0,
  );
  check(
    `${tag} report pane has no check-log table`,
    (await reportPane.locator("table").count()) === 0,
  );
  check(`${tag} report peek`, await page.getByText(/Bayux/).first().isVisible());
  check(`${tag} who checked it is Ryan`, await page.getByText(/^Ryan$/).first().isVisible());
  check(`${tag} helper text not in who-checked`, (await page.getByText(/Who checked it:\s*Speed sensor fault/i).count()) === 0);
  const sawOnReport = page.getByRole("heading", { name: "What the tech saw" });
  await sawOnReport.scrollIntoViewIfNeeded();
  check(`${tag} what the tech saw`, await sawOnReport.isVisible());
  check(
    `${tag} observation on report`,
    await page.getByRole("heading", { name: "What the tech saw" }).locator("..").getByText("Speed sensor fault").isVisible(),
  );
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
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByText(/CHECK 1/i).first().waitFor();
  check("gas mouse Start left Job header", (await page.getByTestId("start-checks").count()) === 0);
  check("gas mouse Start reached factory Check 1", await page.getByText(/CHECK 1/i).first().isVisible());
  check("gas factory pack N/A badge", await page.getByTestId("pack-na-badge").first().isVisible());
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

async function readStoredJob(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("cartscope-jobs-v1");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const jobs = parsed?.state?.jobs ?? parsed?.jobs ?? [];
      return jobs[0] ?? null;
    } catch {
      return null;
    }
  });
}

async function fillLeadAcidPack(page, { count, volts, ir, age }) {
  for (let i = 1; i <= count; i++) {
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} resting volts`, "i") }).fill(String(volts));
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} internal resistance`, "i") }).fill(String(ir));
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} age`, "i") }).fill(age);
  }
}

async function runStickySaveAdvance() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await startIqJob(page);

  const mega = page.getByRole("button", { name: /megaohms/i }).first();
  await page.getByLabel(/^Battery 1 internal resistance$/i).fill("12.1");
  await mega.click();
  check("advance IR number stays 12.1 after MΩ", (await page.getByLabel(/^Battery 1 internal resistance$/i).inputValue()) === "12.1");
  await page.getByRole("button", { name: /milliohms/i }).first().click();

  await fillLeadAcidPack(page, { count: 6, volts: "8.45", ir: "3.4", age: "03/2026" });
  check("advance pack in shop range", await page.getByText(/in the shop range/i).isVisible());
  const packSave = page.getByTestId("bay-primary-action");
  check("advance pack save enabled", await packSave.isEnabled());
  check("advance pack form wired", (await page.locator("#bay-check-form").count()) === 1);
  check("advance pack button submits form", (await packSave.getAttribute("form")) === "bay-check-form");
  check("advance pack Start hook gone", (await page.getByTestId("start-checks").count()) === 0);
  check(
    "advance pack Save owns bay-primary",
    (await page.locator("[data-bay-primary]").count()) === 1 &&
      (await packSave.getAttribute("data-bay-primary")) !== null,
  );
  check("advance pack Save is a button path", (await packSave.getAttribute("type")) === "button");
  await gloveClickPrimary(page);
  await page.getByRole("heading", { name: /Save a program file before you clear/i }).waitFor({ timeout: 10000 });
  check("advance pack sticky Save left pack", await page.getByRole("heading", { name: /Save a program file before you clear/i }).isVisible());
  check("advance pack heading gone", (await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).count()) === 0);
  const storedPack = await readStoredJob(page);
  check("advance packCheck saved on job", Boolean(storedPack?.packCheck), JSON.stringify(storedPack?.packCheck ?? null));
  check("advance pack phase left pack", storedPack?.casePhase === "codes" || storedPack?.casePhase === "steps", String(storedPack?.casePhase));
  check("advance pack IR unit on record", storedPack?.packCheck?.cells?.some((c) => c.ir && (c.irUnit === "mohm" || /mΩ/.test(c.ir))), JSON.stringify(storedPack?.packCheck?.cells?.[0] ?? null));

  await page.getByTestId("bay-dock").getByRole("tab", { name: "Report" }).click();
  await page.getByText(/Report peek|Report draft/i).first().waitFor();
  const packSection = page.getByRole("heading", { name: /Battery pack|Pack check|Pack/i }).first();
  await packSection.scrollIntoViewIfNeeded().catch(() => {});
  const reportText = await page.locator("body").innerText();
  check("advance report shows IR with unit", /12\.1\s*mΩ|IR 12\.1 mΩ|3\.4\s*mΩ|IR 3\.4 mΩ/.test(reportText), reportText.slice(0, 200));
  check("advance who checked it still Ryan", /Who checked it[\s\S]{0,40}Ryan/.test(reportText) || (await page.getByText(/^Ryan$/).count()) > 0);
  check("advance report form wired", (await page.locator("#bay-report-form").count()) === 1);
  check("advance only one visible primary", (await page.getByTestId("bay-primary-action").filter({ visible: true }).count()) === 1);
  await mouseClickPrimary(page);
  await page.waitForTimeout(800);
  const storedAfterConfirm = await readStoredJob(page);
  check(
    "advance review and confirm saved",
    Boolean(storedAfterConfirm?.reportConfirmed) || (await page.getByText(/This case is marked complete/i).count()) > 0,
    String(storedAfterConfirm?.reportConfirmed),
  );
  await page.close();

  const gas = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await gas.goto(BASE, { waitUntil: "networkidle" });
  const neu = gas.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await gas.getByRole("button", { name: /Club Car/i }).click();
  await gas.getByRole("button", { name: /DS \/ Villager FE290/ }).click();
  await gas.getByRole("button", { name: /Engine will not crank/i }).click();
  const headerBtn = gas.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(gas, {
    last: "Gasadv",
    job: "HCP-5510",
    year: "2008",
    serial: "GFE29012",
    who: "Ryan",
    complaint: "No crank.",
  });
  await mouseClickStart(gas);
  await gas.waitForURL("**/bench/**", { timeout: 15000 });
  await gas.getByText(/CHECK 1/i).first().waitFor();
  await mouseClickPrimary(gas);
  const blockedSave = gas.getByTestId("bay-save-notice");
  check("advance factory Save without a pick shows a reason", await blockedSave.isVisible());
  const blockedText = await blockedSave.innerText();
  check(
    "advance factory Save names the missing setup choice",
    /Setup is right — keep going/.test(blockedText) && /A switch or cable is wrong/.test(blockedText),
    blockedText,
  );
  check("advance factory still Check 1 after blocked Save", await gas.getByText(/CHECK 1/i).first().isVisible());
  await gas.getByRole("button", { name: /Setup is right — keep going/i }).click();
  const checkSave = gas.getByTestId("bay-primary-action");
  check("advance factory save enabled", await checkSave.isEnabled());
  check("advance factory Start hook gone", (await gas.getByTestId("start-checks").count()) === 0);
  check(
    "advance factory Save owns bay-primary",
    (await gas.locator("[data-bay-primary]").count()) === 1 &&
      (await checkSave.getAttribute("data-bay-primary")) !== null,
  );
  const stepBefore = await readStoredJob(gas);
  await mouseClickPrimary(gas);
  await gas.getByText(/CHECK 2/i).first().waitFor({ timeout: 8000 });
  check("advance factory sticky Save left check 1", await gas.getByText(/CHECK 2/i).first().isVisible());
  const storedCheck = await readStoredJob(gas);
  check("advance factory currentStepId moved", storedCheck?.currentStepId && storedCheck.currentStepId !== (stepBefore?.currentStepId ?? "g-setup"), `${stepBefore?.currentStepId} -> ${storedCheck?.currentStepId}`);
  check("advance factory log saved", (storedCheck?.log?.length ?? 0) >= 1, String(storedCheck?.log?.length));
  await gas.close();
}

async function runHelperRedirect() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /Club Car/i }).click();
  await page.getByRole("button", { name: /DS \/ Villager FE290/ }).click();
  await page.getByRole("button", { name: /Engine will not crank/i }).click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last: "Helpred",
    job: "HCP-5518",
    year: "2008",
    serial: "GFE29018",
    who: "Ryan",
    complaint: "No crank.",
  });
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByText(/CHECK 1/i).first().waitFor();
  await page.getByRole("button", { name: /Setup is right — keep going/i }).click();
  const before = await readStoredJob(page);
  await page.getByTestId("bay-dock").getByRole("tab", { name: "Helper" }).click();
  await page.getByTestId("bay-helper-sheet").waitFor({ state: "visible" });
  const sawBox = page.getByLabel(/^What you see$/i);
  await sawBox.fill("solenoid clicks but the starter does not crank — try the direction switch");
  await page.getByTestId("helper-use-observation").click();
  const jumps = page.getByTestId("helper-redirect-list");
  await jumps.waitFor({ state: "visible", timeout: 2000 });
  check("helper redirect list appears", await jumps.isVisible());
  const looking = page.getByTestId("helper-looking");
  await looking.waitFor({ state: "hidden", timeout: 50000 }).catch(() => {});
  check("helper use-this finished", (await looking.count()) === 0 || !(await looking.isVisible()));
  check("helper jump buttons still there after ask", await jumps.isVisible());
  const jumpBtn = jumps.getByRole("button").first();
  check("helper jump button tappable", await jumpBtn.isVisible());
  await mouseClickLocator(page, jumpBtn, "helper jump");
  const after = await readStoredJob(page);
  check("helper jump moved the check", Boolean(after?.currentStepId && after.currentStepId !== before?.currentStepId), `${before?.currentStepId} -> ${after?.currentStepId}`);
  check("helper jump left setup / pack", after?.casePhase === "steps", String(after?.casePhase));
  check("helper jump kept who checked it", after?.technician === "Ryan", String(after?.technician));
  check("helper jump kept meter draft", after?.meterDraft?.selected === "yes" || after?.meterDraft?.stepId === before?.meterDraft?.stepId, JSON.stringify(after?.meterDraft ?? null));
  await page.screenshot({ path: `${out}/bay-helper-redirect.png` });
  await page.close();
}

async function runHelperJumpFromPack() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await startIqJob(page, "Hayden");
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
  const before = await readStoredJob(page);
  check("pack helper who is Hayden before jump", before?.technician === "Hayden", String(before?.technician));
  await page.getByTestId("bay-dock").getByRole("tab", { name: "Helper" }).click();
  await page.getByTestId("bay-helper-sheet").waitFor({ state: "visible" });
  check("pack helper still on Pack check", await page.getByTestId("bay-helper-sheet").getByText("Pack check").first().isVisible());
  const sawBox = page.getByLabel(/^What you see$/i);
  await sawBox.fill("direction switch stuck in reverse — only runs one way");
  await page.getByTestId("helper-use-observation").click();
  const jumps = page.getByTestId("helper-redirect-list");
  await jumps.waitFor({ state: "visible", timeout: 2000 });
  const looking = page.getByTestId("helper-looking");
  await looking.waitFor({ state: "hidden", timeout: 50000 }).catch(() => {});
  check("pack helper use-this left loading", (await looking.count()) === 0 || !(await looking.isVisible()));
  const jumpBtn = jumps.getByRole("button").first();
  check("pack helper jump button tappable", await jumpBtn.isVisible());
  await mouseClickLocator(page, jumpBtn, "pack helper jump");
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  const after = await readStoredJob(page);
  check(
    "pack helper jump left Pack phase",
    after?.casePhase === "steps" && after?.currentStepId && after.currentStepId !== before?.currentStepId,
    `${before?.casePhase}:${before?.currentStepId} -> ${after?.casePhase}:${after?.currentStepId}`,
  );
  check("pack helper jump kept who checked it", after?.technician === "Hayden", String(after?.technician));
  check(
    "pack helper jump changed active check heading",
    (await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).count()) === 0 &&
      (await page.getByText(/CHECK /i).count()) > 0,
  );
  check(
    "pack helper jump kept pack draft",
    Boolean(after?.packDraft) || before?.packDraft == null,
    JSON.stringify(after?.packDraft ?? null),
  );
  check(
    "pack heading gone after jump",
    (await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).count()) === 0,
  );
  await page.screenshot({ path: `${out}/bay-helper-jump-pack.png` });
  await page.close();
}

async function runRound7StartValidationAndBayImprovements() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /Club Car/i }).click();
  await page.getByRole("button", { name: /DS IQ/i }).first().click();
  await page.getByRole("button", { name: /Motor braking does not work/i }).click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last: "Braking",
    job: "HCP-5701",
    year: "2006",
    battery: "Lead-acid",
    who: "Hayden",
    complaint: "Motor braking does not work",
  });
  const brakingStart = page.getByTestId("start-checks");
  check("motor braking Start is ready", (await brakingStart.getAttribute("data-start-ready")) === "true");
  check("motor braking Start not blocked", (await page.getByTestId("start-blocked-reason").count()) === 0);
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor({ timeout: 15000 });
  check(
    "motor braking Start reached pack",
    await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).isVisible(),
  );
  const zoom = page.getByTestId("diagram-zoom");
  await zoom.waitFor({ state: "visible", timeout: 10000 });
  check("diagram zoom label visible", await zoom.isVisible());
  const zoomText = await zoom.innerText();
  const pct = Number((zoomText.match(/(\d+)\s*%/) || [])[1] || 0);
  check("diagram default zoom is larger than 100%", pct >= 135, zoomText);
  await page.getByTestId("bay-dock").getByRole("tab", { name: "Helper" }).click();
  await page.getByTestId("helper-pane-nav").waitFor({ state: "visible" });
  check("helper pane nav visible", await page.getByTestId("helper-pane-nav").isVisible());
  check("helper pane nav has Checks", await page.getByTestId("helper-pane-nav").getByRole("button", { name: /Checks/i }).isVisible());
  await page.getByTestId("helper-pane-nav").getByRole("button", { name: /Checks/i }).click();
  check(
    "helper Checks nav left Helper",
    (await page.getByTestId("bay-helper-sheet").count()) === 0 || !(await page.getByTestId("bay-helper-sheet").isVisible()),
  );
  await page.close();

  const gas = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  gas.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await gas.goto(BASE, { waitUntil: "networkidle" });
  const neuGas = gas.getByRole("button", { name: /New job/i });
  if (await neuGas.count()) await neuGas.click();
  await gas.getByRole("button", { name: /EZ-GO/i }).click();
  await gas.getByRole("button", { name: /Marathon/i }).click();
  await gas.getByRole("button", { name: /Engine will not crank/i }).click();
  const gasHeader = gas.getByRole("button", { name: /Job header/i });
  if (await gasHeader.count()) await gasHeader.click();
  await fillHeader(gas, {
    last: "Yearbad",
    job: "HCP-5702",
    year: "2010",
    who: "Hayden",
    complaint: "No crank.",
  });
  const yearNote = gas.getByTestId("year-compat");
  check("marathon 2010 year error visible", await yearNote.isVisible());
  check("marathon 2010 year names range", /2010/.test(await yearNote.innerText()) && /1991/.test(await yearNote.innerText()));
  const blocked = gas.getByTestId("start-blocked-reason");
  check("marathon 2010 Start reason visible", await blocked.isVisible());
  check("marathon 2010 Start reason names year", /2010/.test(await blocked.innerText()) && /1991/.test(await blocked.innerText()));
  check("marathon 2010 Start not ready", (await gas.getByTestId("start-checks").getAttribute("data-start-ready")) === "false");
  await mouseClickStart(gas);
  await gas.waitForTimeout(600);
  check("marathon 2010 Start stayed on header", (await gas.getByTestId("start-checks").count()) === 1);
  check("marathon 2010 still explains after tap", await gas.getByTestId("start-blocked-reason").isVisible());

  await gas.getByLabel(/^Year$/i).fill("1996");
  check("marathon 1996 year accepted", /1996/.test(await gas.getByTestId("year-compat").innerText()));
  check("marathon 1996 Start ready", (await gas.getByTestId("start-checks").getAttribute("data-start-ready")) === "true");
  await gas.getByTestId("start-blocked-reason").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  check("marathon 1996 Start unblocked", (await gas.getByTestId("start-blocked-reason").count()) === 0);
  await mouseClickStart(gas);
  await gas.waitForURL("**/bench/**", { timeout: 15000 });
  await gas.getByText(/CHECK 1/i).first().waitFor({ timeout: 15000 });
  check("marathon 1996 Start reached Check 1", await gas.getByText(/CHECK 1/i).first().isVisible());
  await gas.getByTestId("pack-na-badge").first().waitFor({ state: "visible", timeout: 8000 });
  check("gas pack N/A badge visible", await gas.getByTestId("pack-na-badge").first().isVisible());
  check("gas pack N/A badge text", (await gas.getByTestId("pack-na-badge").first().innerText()).includes("Pack N/A"));
  check(
    "gas sticky Save still visible with N/A badge",
    await gas.getByTestId("bay-action-bar").getByRole("button", { name: /Save and go on/i }).isVisible(),
  );
  await gas.screenshot({ path: `${out}/bay-round7-gas-na.png` });
  await gas.close();
}

async function runHelperJumpFromNotFullyCharged() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /Club Car/i }).click();
  await page.getByRole("button", { name: /DS PowerDrive 48/i }).first().click();
  await page.getByRole("button", { name: /Cart not being fully charged/i }).click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last: "Chgjump",
    job: "HCP-5520",
    year: "1998",
    battery: "Lead-acid",
    serial: "PD48CHG1",
    who: "Hayden",
    complaint: "Not fully charged.",
  });
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
  await fillLeadAcidPack(page, { count: 6, volts: "8.45", ir: "3.4", age: "03/2026" });
  await mouseClickPrimary(page);
  await page.getByText(/Not fully charged/i).first().waitFor({ timeout: 10000 });
  check("charge job reached Check 1 Not fully charged", await page.getByText(/Not fully charged/i).first().isVisible());
  check("charge job Check 1 chip", await page.getByTestId("bay-action-bar").getByText(/Check 1 of /i).isVisible());
  const before = await readStoredJob(page);
  check("charge job who is Hayden before jump", before?.technician === "Hayden", String(before?.technician));
  check("charge job still on dchg", before?.currentStepId === "dchg" || /dchg|not fully charged/i.test(`${before?.currentStepId} ${before?.casePhase}`), String(before?.currentStepId));

  await page.getByTestId("bay-dock").getByRole("tab", { name: "Helper" }).click();
  await page.getByTestId("bay-helper-sheet").waitFor({ state: "visible" });
  const sawBox = page.getByLabel(/^What you see$/i);
  await sawBox.fill("won't charge — solenoid clicks, try the direction switch");
  await page.getByTestId("helper-use-observation").click();
  const jumps = page.getByTestId("helper-redirect-list");
  await jumps.waitFor({ state: "visible", timeout: 2000 });
  check("charge helper local jumps while looking or after", await jumps.isVisible());
  const looking = page.getByTestId("helper-looking");
  await looking.waitFor({ state: "hidden", timeout: 50000 }).catch(() => {});
  check("charge helper left loading after AI timeout", (await looking.count()) === 0 || !(await looking.isVisible()));
  check("charge helper jump buttons after timeout", await jumps.isVisible());
  const jumpBtn = jumps.getByRole("button").first();
  check("charge helper jump button tappable", await jumpBtn.isVisible());
  await mouseClickLocator(page, jumpBtn, "charge helper jump");
  await page.getByText(/Not fully charged/i).first().waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  const after = await readStoredJob(page);
  check(
    "charge helper jump left Check 1",
    after?.casePhase === "steps" && after?.currentStepId && after.currentStepId !== before?.currentStepId,
    `${before?.casePhase}:${before?.currentStepId} -> ${after?.casePhase}:${after?.currentStepId}`,
  );
  check("charge helper jump kept who checked it", after?.technician === "Hayden", String(after?.technician));
  check(
    "charge helper jump changed the active check",
    (await page.getByRole("heading", { name: /^Not fully charged$/i }).count()) === 0,
  );
  check(
    "charge helper jump kept pack draft",
    Boolean(after?.packDraft) || Boolean(after?.packCheck) || before?.packDraft == null,
    JSON.stringify({ draft: after?.packDraft ?? null, pack: Boolean(after?.packCheck) }),
  );
  await page.screenshot({ path: `${out}/bay-helper-jump-check1.png` });
  await page.close();
}

async function startElectricPackJob(page, { brand, model, complaint, last, job, year, serial, who }) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: brand }).click();
  await page.getByRole("button", { name: model }).first().click();
  await page.getByRole("button", { name: complaint }).first().click();
  const headerBtn = page.getByRole("button", { name: /Job header/i });
  if (await headerBtn.count()) await headerBtn.click();
  await fillHeader(page, {
    last,
    job,
    year,
    battery: "Lead-acid",
    serial,
    who,
    complaint: "Bay pack save.",
  });
  await mouseClickStart(page);
  await page.waitForURL("**/bench/**", { timeout: 15000 });
  await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
}

async function runLiveFailList() {
  const yamaha = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  yamaha.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await startElectricPackJob(yamaha, {
    brand: /Yamaha/i,
    model: /YDRE DC/i,
    complaint: /Will not run either way/i,
    last: "Ydre",
    job: "HCP-5801",
    year: "2012",
    serial: "YDREDC01",
    who: "Ryan",
  });
  await fillLeadAcidPack(yamaha, { count: 6, volts: "8.45", ir: "3.4", age: "03/2026" });
  check("YDRE pack in shop range", await yamaha.getByText(/in the shop range/i).isVisible());
  await gloveClickPrimary(yamaha);
  await yamaha.getByRole("heading", { name: /Save a program file before you clear/i }).waitFor({ timeout: 10000 });
  check(
    "YDRE DC mouse Save left Battery Pack",
    await yamaha.getByRole("heading", { name: /Save a program file before you clear/i }).isVisible(),
  );
  check(
    "YDRE DC pack heading gone",
    (await yamaha.getByRole("heading", { name: /Check the pack before you blame other parts/i }).count()) === 0,
  );
  await fillHandheldAndSave(yamaha);
  await saveFactoryCheck1To2(
    yamaha,
    /Solenoid does NOT click/i,
    /Step 1 — RUN position/i,
    "YDRE DC",
  );
  await yamaha.close();

  const precedent = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  precedent.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await startElectricPackJob(precedent, {
    brand: /Club Car/i,
    model: /Precedent ERIC/i,
    complaint: /Cart does not run/i,
    last: "Eric",
    job: "HCP-5802",
    year: "2017",
    serial: "ERIC01",
    who: "Ryan",
  });
  await gloveClickPrimary(precedent);
  const emptyPackNotice = precedent.getByTestId("bay-save-notice");
  check("Precedent empty pack Save shows a reason", await emptyPackNotice.isVisible());
  const emptyPackText = await emptyPackNotice.innerText();
  check(
    "Precedent empty pack names missing volts or age",
    /resting volts|age|Battery 1/i.test(emptyPackText),
    emptyPackText,
  );
  check(
    "Precedent empty pack still on pack after blocked Save",
    await precedent.getByRole("heading", { name: /Check the pack before you blame other parts/i }).isVisible(),
  );
  await fillLeadAcidPack(precedent, { count: 6, volts: "8.45", ir: "3.4", age: "03/2026" });
  check("Precedent ERIC pack in shop range", await precedent.getByText(/in the shop range/i).isVisible());
  await gloveTouchPrimary(precedent);
  await precedent.getByRole("heading", { name: /Save a program file before you clear/i }).waitFor({ timeout: 10000 });
  check(
    "Precedent ERIC touch Save left Battery Pack",
    await precedent.getByRole("heading", { name: /Save a program file before you clear/i }).isVisible(),
  );
  await fillHandheldAndSave(precedent);
  await saveFactoryCheck1To2(
    precedent,
    /Switches are set — go on/i,
    /Check battery pack power/i,
    "Precedent ERIC",
  );
  await precedent.close();

  const fe350 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  fe350.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await fe350.goto(BASE, { waitUntil: "networkidle" });
  const neu = fe350.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await fe350.getByRole("button", { name: /Club Car/i }).click();
  await fe350.getByRole("button", { name: /DS FE350/i }).click();
  await fe350.getByRole("button", { name: /Engine will not crank/i }).click();
  const feHeader = fe350.getByRole("button", { name: /Job header/i });
  if (await feHeader.count()) await feHeader.click();
  await fillHeader(fe350, {
    last: "Fe350",
    job: "HCP-5803",
    year: "2010",
    who: "Hayden",
    complaint: "No crank.",
  });
  const yearNote = fe350.getByTestId("year-compat");
  const yearText = await yearNote.innerText();
  const bannerText = await fe350.getByTestId("start-blocked-reason").innerText();
  check("FE350 2010 names 1991–1996", /2010/.test(yearText) && /1991–1996|1991-1996/.test(yearText), yearText);
  check("FE350 2010 field does not show 1991–1990", !/1991–1990|1991-1990/.test(yearText), yearText);
  check("FE350 2010 banner names 1991–1996", /2010/.test(bannerText) && /1991–1996|1991-1996/.test(bannerText), bannerText);
  check("FE350 2010 banner does not show 1991–1990", !/1991–1990|1991-1990/.test(bannerText), bannerText);
  check(
    "FE350 2010 field and Start banner use the same year span",
    yearCoverSpan(yearText) === yearCoverSpan(bannerText) && yearCoverSpan(yearText).includes("1996"),
    `${yearCoverSpan(yearText)} vs ${yearCoverSpan(bannerText)}`,
  );
  check("FE350 2010 does not show 1995–1996 as the range", !/1995–1996|1995-1996/.test(yearText + bannerText), yearText);
  check("FE350 2010 Start not ready", (await fe350.getByTestId("start-checks").getAttribute("data-start-ready")) === "false");
  await mouseClickStart(fe350);
  await fe350.waitForTimeout(400);
  check("FE350 2010 Start stays on header", (await fe350.getByTestId("start-checks").count()) === 1);
  const yearBox = fe350.getByLabel(/^Year$/i);
  await yearBox.fill("");
  await yearBox.pressSequentially("1996", { delay: 40 });
  check("FE350 1996 stays 1996 in the box", (await yearBox.inputValue()) === "1996");
  const okHint = await fe350.getByTestId("year-compat").innerText();
  check("FE350 1996 hint is not 1991–1990", !/1991–1990|1991-1990/.test(okHint), okHint);
  check("FE350 1996 hint names 1991–1996", /1991–1996|1991-1996/.test(okHint), okHint);
  check("FE350 1996 Start ready", (await fe350.getByTestId("start-checks").getAttribute("data-start-ready")) === "true");
  await mouseClickStart(fe350);
  await fe350.waitForURL("**/bench/**", { timeout: 15000 });
  await fe350.getByText(/CHECK 1/i).first().waitFor({ timeout: 15000 });
  check("FE350 1996 Start opened Check 1", await fe350.getByText(/CHECK 1/i).first().isVisible());
  await mouseClickPrimary(fe350);
  const fe350Blocked = fe350.getByTestId("bay-save-notice");
  check("FE350 gas no-pick Save shows a reason", await fe350Blocked.isVisible());
  const fe350BlockedText = await fe350Blocked.innerText();
  check(
    "FE350 gas no-pick names Setup is right",
    /Setup is right — keep going/.test(fe350BlockedText) && /A switch or cable is wrong/.test(fe350BlockedText),
    fe350BlockedText,
  );
  check("FE350 gas no-pick still Check 1", await fe350.getByText(/CHECK 1/i).first().isVisible());
  await fe350.getByRole("button", { name: /Setup is right — keep going/i }).click();
  await mouseClickPrimary(fe350);
  await fe350.getByText(/CHECK 2/i).first().waitFor({ timeout: 10000 });
  check("FE350 gas after pick sticky Save left Check 1", await fe350.getByText(/CHECK 2/i).first().isVisible());
  await fe350.close();
}

await runAt(1024, 768, "tablet");
await runAt(390, 844, "phone");
await runFactoryCheck();
await runStickySaveAdvance();
await runLiveFailList();
await runHelperRedirect();
await runHelperJumpFromPack();
await runHelperJumpFromNotFullyCharged();
await runRound7StartValidationAndBayImprovements();

await browser.close();
if (fails.length) {
  console.error("FAILED", fails.join(", "));
  process.exit(1);
}
console.log("ALL BAY UX CHECKS PASSED");
