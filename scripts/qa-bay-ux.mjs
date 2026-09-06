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
  await installLiveChrome(page);
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

/** Live cart-scope.vercel.app has a fixed Grok pill on the lower-right. */
async function installLiveChrome(page) {
  await page.evaluate(() => {
    if (document.getElementById("grok-pill-sim")) return;
    const el = document.createElement("div");
    el.id = "grok-pill-sim";
    el.setAttribute("data-testid", "grok-pill-sim");
    el.style.cssText =
      "position:fixed;right:12px;bottom:12px;z-index:2147483647;width:180px;height:40px;background:rgba(20,20,20,0.55);pointer-events:auto;border-radius:999px;";
    document.body.appendChild(el);
  });
}

/** Real mouse click on the sticky Save — not keyboard Enter, not a JS click. */
async function mouseClickPrimary(page) {
  await installLiveChrome(page);
  const btn = page.getByTestId("bay-primary-action").filter({ visible: true });
  await btn.waitFor({ state: "visible" });
  const box = await btn.boundingBox();
  if (!box) throw new Error("sticky Save has no box");
  // Live testers tap the lower-right of the wide Save, under the Grok pill.
  const x = box.x + box.width * 0.85;
  const y = box.y + box.height * 0.7;
  const hit = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return { hitSave: false, start: false, pill: false, tag: null };
      return {
        hitSave: Boolean(el.closest("[data-testid='bay-primary-action']")),
        start: Boolean(el.closest("[data-testid='start-checks']")),
        pill: Boolean(el.closest("[data-testid='grok-pill-sim']")),
        tag: el.tagName,
        testid: el.getAttribute("data-testid"),
      };
    },
    { x, y },
  );
  if (!hit.hitSave || hit.start || hit.pill) {
    throw new Error(`sticky Save mouse target is not Save: ${JSON.stringify(hit)}`);
  }
  await page.mouse.click(x, y, { button: "left" });
}

/** Real mouse click on Job header Start checks — same path the bay tech uses. */
async function mouseClickStart(page) {
  await installLiveChrome(page);
  const btn = page.getByTestId("start-checks");
  await btn.waitFor({ state: "visible" });
  await btn.scrollIntoViewIfNeeded();
  const box = await btn.boundingBox();
  if (!box) throw new Error("Start checks has no box");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "left" });
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
  await mouseClickPrimary(page);
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
  await installLiveChrome(gas);
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
  await looking.waitFor({ state: "hidden", timeout: 12000 }).catch(() => {});
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
  await looking.waitFor({ state: "hidden", timeout: 12000 }).catch(() => {});
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

async function runHelperJumpFromNotFullyCharged() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await installLiveChrome(page);
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
  await looking.waitFor({ state: "hidden", timeout: 12000 }).catch(() => {});
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

await runAt(1024, 768, "tablet");
await runAt(390, 844, "phone");
await runFactoryCheck();
await runStickySaveAdvance();
await runHelperRedirect();
await runHelperJumpFromPack();
await runHelperJumpFromNotFullyCharged();

await browser.close();
if (fails.length) {
  console.error("FAILED", fails.join(", "));
  process.exit(1);
}
console.log("ALL BAY UX CHECKS PASSED");
