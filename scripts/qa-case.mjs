import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const out = "/workspace/screenshots";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});

async function fillHeader({ last, job, year, battery, complaint, serial }) {
  await page.getByLabel(/Customer last name/i).fill(last);
  await page.getByLabel(/Housecall Pro job number/i).fill(job);
  await page.getByLabel(/^Year$/i).fill(year);
  if (serial) await page.getByLabel(/Serial/i).fill(serial);
  if (complaint) await page.getByLabel(/Short complaint note/i).fill(complaint);
  if (battery) {
    await page.getByRole("button", { name: battery, exact: true }).click();
  }
}

function bodyHas(re) {
  return page.locator("body").innerText().then((t) => re.test(t));
}

async function startNewJob() {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const neu = page.getByRole("button", { name: /New job/i });
  if (await neu.count()) await neu.click();
  await page.getByRole("button", { name: /EZ-GO|Club Car|Yamaha/i }).first().waitFor({ state: "visible" });
}

async function pickBrand(name) {
  await page.getByRole("button", { name }).click();
  await page.getByText(/Electric|Gas/i).first().waitFor({ state: "visible" });
}

async function fillLeadAcidPack({ count, voltFor, irFor, age }) {
  for (let i = 1; i <= count; i++) {
    const volts = typeof voltFor === "function" ? voltFor(i) : voltFor;
    const ir = typeof irFor === "function" ? irFor(i) : irFor;
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} resting volts`, "i") }).fill(String(volts));
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} internal resistance`, "i") }).fill(ir);
    await page.getByRole("textbox", { name: new RegExp(`^Battery ${i} age`, "i") }).fill(age);
  }
}

async function fillHandheld({ last }) {
  await page.getByRole("heading", { name: /Save a program file before you clear/i }).waitFor();
  const program = page.getByRole("textbox", { name: /^Program file name/i });
  const programVal = await program.inputValue();
  console.log("program suggested", programVal);
  if (last && !programVal.includes(last.replace(/\s+/g, ""))) {
    throw new Error("Program file name missing last name");
  }
  if (!/_Program/.test(programVal)) throw new Error("Program file name missing Program kind");
  const saveCodes = page.getByRole("button", { name: /Save codes and go on/i });
  console.log("save codes disabled before capture", await saveCodes.isDisabled());
  console.log("logger not used default", await page.getByRole("checkbox", { name: /logger not used/i }).isChecked());
  const clearBox = page.getByRole("checkbox", { name: /I cleared codes/i });
  console.log("clear disabled before capture", await clearBox.isDisabled());
  await page.getByRole("textbox", { name: /^Present codes/i }).fill("None");
  await page.getByRole("textbox", { name: /^History codes/i }).fill("None");
  await page.getByRole("checkbox", { name: /does not show fault counters/i }).check();
  console.log("clear enabled after capture", !(await clearBox.isDisabled()));
  console.log("save codes enabled after capture", !(await saveCodes.isDisabled()));
  await saveCodes.click();
}

async function confirmAndCheckShop({ last, job, serial, handheld = false }) {
  await page.getByRole("button", { name: /Review and confirm/i }).click();
  await page.getByText(/Saved on this device/).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Show shop copy/i }).click();
  await page.getByTestId("shop-copy").waitFor({ state: "visible", timeout: 15000 });
  const saved = await bodyHas(/Saved on this device/);
  const ready = await bodyHas(/Brain copy ready/);
  const waiting = await bodyHas(/Brain copy waiting — retry/);
  const sent = await bodyHas(/Brain copy sent \(redacted\)/);
  console.log("confirm saved", saved, "ready", ready, "waiting", waiting, "sent", sent);
  const shop = await page.getByTestId("shop-copy").innerText();
  const shopHasLast = new RegExp(last, "i").test(shop);
  const shopHasJob = new RegExp(job.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(shop);
  const shopHasSerial = serial ? shop.includes(serial) : true;
  const shopHasVehicle = /## Vehicle/.test(shop);
  const shopHasTests = /## Tests performed/.test(shop);
  const shopHasPrivacy = /## Privacy check/.test(shop);
  const shopHasEmail = /@ngc\.test/i.test(shop) || /@gmail\.|@yahoo\./i.test(shop);
  const shopHasPhone = /985-555-/.test(shop);
  const shopHasLastLabel = /Customer last name/i.test(shop);
  const shopHasHcpLabel = /Housecall Pro/i.test(shop);
  console.log(
    "shop leaks last",
    shopHasLast,
    "job",
    shopHasJob,
    "last-label",
    shopHasLastLabel,
    "hcp-label",
    shopHasHcpLabel,
    "email",
    shopHasEmail,
    "phone",
    shopHasPhone,
    "keeps serial",
    shopHasSerial,
    "sections",
    shopHasVehicle && shopHasTests && shopHasPrivacy,
  );
  const deviceStillHas = (await bodyHas(new RegExp(last, "i"))) && (await bodyHas(new RegExp(job.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")));
  console.log("device still has last+job", deviceStillHas);
  if (shopHasLast || shopHasJob || shopHasLastLabel || shopHasHcpLabel || shopHasEmail || shopHasPhone) {
    throw new Error("Shop copy leaked private info");
  }
  if (!saved || !deviceStillHas || !shopHasVehicle || !ready || !waiting) {
    throw new Error("Confirm / shop copy incomplete");
  }
  if (handheld) {
    const shopHasProgram = /_Program/.test(shop);
    const shopHasLog = /logger not used/i.test(shop);
    const shopHasLastInName = new RegExp(`_${last.replace(/\s+/g, "")}_`, "i").test(shop);
    console.log(
      "shop handheld program",
      shopHasProgram,
      "log unused",
      shopHasLog,
      "no last in handheld name",
      !shopHasLastInName,
    );
    if (!shopHasProgram || shopHasLastInName) throw new Error("Shop handheld names wrong");
    console.log("device has program file", await bodyHas(/Program file:/i));
    const shopHasIr = /IR /i.test(shop) || /internal resistance/i.test(shop);
    const shopHasAge = /age /i.test(shop) || /12\/2024/.test(shop);
    console.log("shop pack IR/age", shopHasIr, shopHasAge);
    if (!shopHasIr) throw new Error("Shop copy missing IR");
  }
}

// --- Path A: EZ-GO TXT will not run (electric pack fail + test battery + codes) ---
await startNewJob();
await pickBrand(/EZ-GO/i);
await page.getByRole("button", { name: /TXT 48 V TCT/i }).first().click();
await page.getByRole("button", { name: /Will not run/i }).first().click();
await page.getByRole("button", { name: /Job header/i }).click();
const startDisabled = await page.getByRole("button", { name: /Start checks/i }).isDisabled();
console.log("txt start disabled without header", startDisabled);
await fillHeader({
  last: "Ramirez",
  job: "HCP-4411",
  year: "2016",
  battery: "Lead-acid",
  serial: "ATXT9981",
  complaint: "Call Ramirez at 985-555-0199 or ramirez@ngc.test — 12 Oak Street. Job HCP-4411.",
});
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.getByRole("heading", { name: /Check the pack before you blame other parts/i }).waitFor();
await page.waitForTimeout(200);
const txtPack = await bodyHas(/Check the pack before you blame other parts/i);
const txtSix8 = await bodyHas(/Six 8 V batteries/i);
console.log("txt pack gate", txtPack, "6x8", txtSix8);

await fillLeadAcidPack({
  count: 6,
  voltFor: (i) => (i === 3 ? "7.80" : "8.40"),
  irFor: (i) => (i === 3 ? "8.1 mΩ" : "3.2 mΩ"),
  age: "12/2024",
});
await page.waitForTimeout(200);
const failCopy = await bodyHas(/too low or uneven to trust/i);
const irFlag = await bodyHas(/internal resistance is uneven/i);
const agePair = await bodyHas(/older than about eight months/i);
console.log("txt pack fail copy", failCopy, "ir spread", irFlag, "age+dead", agePair);
await page.screenshot({ path: `${out}/qa-case-txt-pack.png` });
await page.getByRole("button", { name: /Continue on a known-good test battery/i }).click();
const noteBtn = page.getByRole("button", { name: /Save test-battery note and go on/i });
console.log("txt test-battery next disabled empty", await noteBtn.isDisabled());
await page.getByLabel(/What you measured/i).fill("Battery 3 at 7.80 V. Later steps used a known-good test battery.");
console.log("txt test-battery next enabled after note", !(await noteBtn.isDisabled()));
await noteBtn.click();
await page.waitForTimeout(400);
const codes = await bodyHas(/Save a program file before you clear/i);
console.log("txt code gate", codes);
await page.screenshot({ path: `${out}/qa-case-txt-codes.png` });
await fillHandheld({ last: "Ramirez" });
await page.waitForTimeout(500);
const factory = await bodyHas(/CHECK 1/i);
const helper = await bodyHas(/Not enough proof to recommend a repair yet/i);
console.log("txt factory checks", factory, "helper blocked", helper);
await page.screenshot({ path: `${out}/qa-case-txt-steps.png` });

await page.getByRole("button", { name: /Report/i }).click();
await page.waitForTimeout(400);
console.log(
  "txt report",
  await bodyHas(/Ramirez/),
  await bodyHas(/HCP-4411/),
  await bodyHas(/test battery/i),
  await bodyHas(/Not enough proof to recommend a repair yet/i),
);
await page.screenshot({ path: `${out}/qa-case-txt-report.png` });
await confirmAndCheckShop({ last: "Ramirez", job: "HCP-4411", serial: "ATXT9981", handheld: true });
await page.screenshot({ path: `${out}/qa-case-txt-brain.png` });

// --- Path B: Club Car gas FE290, no pack gate, different complaint ---
await startNewJob();
await pickBrand(/Club Car/i);
await page.getByRole("button", { name: /DS \/ Villager FE290/ }).click();
await page.getByRole("button", { name: /Engine will not crank/i }).click();
await page.getByRole("button", { name: /Job header/i }).click();
console.log("gas header has no battery type", (await page.getByRole("button", { name: /^Lead-acid$/ }).count()) === 0);
await fillHeader({
  last: "Chen",
  job: "HCP-7782",
  year: "2008",
  serial: "GFE29011",
  complaint: "Email chen@ngc.test or 985-555-0144 at 40 Pine Road.",
});
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.waitForTimeout(400);
const gasNoPack = !(await bodyHas(/Check the pack before you blame other parts/i));
const gasChecks = await bodyHas(/CHECK 1/i);
console.log("gas skipped pack", gasNoPack, "factory checks", gasChecks);
await page.screenshot({ path: `${out}/qa-case-gas-steps.png` });

await page.getByRole("button", { name: /Report/i }).click();
await page.waitForTimeout(400);
console.log(
  "gas report",
  await bodyHas(/Chen/),
  await bodyHas(/HCP-7782/),
  await bodyHas(/Engine will not crank/),
  await bodyHas(/Not enough proof to recommend a repair yet/i),
);
await page.screenshot({ path: `${out}/qa-case-gas-report.png` });
await confirmAndCheckShop({ last: "Chen", job: "HCP-7782", serial: "GFE29011" });
await page.screenshot({ path: `${out}/qa-case-gas-brain.png` });

// --- Path C: Club Car Precedent IQ, different electric complaint, pack pass ---
await startNewJob();
await pickBrand(/Club Car/i);
await page.getByRole("button", { name: /Precedent IQ/ }).filter({ hasText: /IQ electric/i }).click();
await page.getByRole("button", { name: /Cart does not run/i }).click();
await page.getByRole("button", { name: /Job header/i }).click();
await fillHeader({ last: "Patel", job: "HCP-9904", year: "2009", battery: "Lead-acid" });
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.waitForTimeout(400);
const iqSix8 = await bodyHas(/Six 8 V batteries/i);
console.log("iq pack gate 6x8", iqSix8);
await fillLeadAcidPack({
  count: 6,
  voltFor: "8.45",
  irFor: "3.4 mΩ",
  age: "03/2026",
});
await page.waitForTimeout(200);
console.log("iq pack pass copy", await bodyHas(/in the shop range/i));
await page.getByRole("button", { name: /Save pack and go on/i }).click();
await page.waitForTimeout(400);
console.log("iq code gate", await bodyHas(/Save a program file before you clear/i));
await fillHandheld({ last: "Patel" });
await page.waitForTimeout(500);
console.log("iq factory checks", await bodyHas(/CHECK 1/i), "helper blocked", await bodyHas(/Not enough proof to recommend a repair yet/i));
await page.screenshot({ path: `${out}/qa-case-iq-steps.png` });
await page.getByRole("button", { name: /Report/i }).click();
await page.waitForTimeout(400);
console.log("iq report", await bodyHas(/Patel/), await bodyHas(/HCP-9904/), await bodyHas(/Cart does not run/));
await page.screenshot({ path: `${out}/qa-case-iq-report.png` });

// --- Path D: EZ-GO RXV uses four 12 V batteries (not TXT 6×8) ---
await startNewJob();
await pickBrand(/EZ-GO/i);
await page.getByRole("button", { name: /RXV AC/ }).click();
await page.getByRole("button", { name: /Cart will not run/i }).click();
await page.getByRole("button", { name: /Job header/i }).click();
await fillHeader({ last: "Nguyen", job: "HCP-1120", year: "2011", battery: "Lead-acid" });
await page.getByRole("button", { name: /Start checks/i }).click();
await page.waitForURL("**/bench/**", { timeout: 10000 });
await page.waitForTimeout(400);
const rxvFour12 = await bodyHas(/Four 12 V batteries/i);
const rxvHasB4 = (await page.getByRole("textbox", { name: /^Battery 4 resting volts/i }).count()) === 1;
const rxvNoB6 = (await page.getByRole("textbox", { name: /^Battery 6 resting volts/i }).count()) === 0;
const rxvIr4 = (await page.getByRole("textbox", { name: /^Battery 4 internal resistance/i }).count()) === 1;
const rxvNoIr6 = (await page.getByRole("textbox", { name: /^Battery 6 internal resistance/i }).count()) === 0;
console.log("rxv 4x12", rxvFour12, "four fields", rxvHasB4, "no sixth", rxvNoB6, "ir4", rxvIr4, "no ir6", rxvNoIr6);
await page.screenshot({ path: `${out}/qa-case-rxv-pack.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/qa-case-rxv-pack-mobile.png` });

await browser.close();
console.log("done");
