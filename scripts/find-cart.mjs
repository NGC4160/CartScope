/** Shop lookup: year + make + model → one cart. Used by bay QA scripts. */
export async function findShopCart(page, { year = "", make, model }) {
  const yearBox = page.getByLabel(/Cart year/i);
  await yearBox.waitFor({ state: "visible", timeout: 10000 });
  if (year !== "" && year != null) {
    await yearBox.fill(String(year));
  }
  await page.getByLabel(/Cart make/i).fill(make);
  await page.getByLabel(/Cart model/i).fill(model);
  await page.getByTestId("find-cart").click();
  await page.getByTestId("cart-match").waitFor({ state: "visible", timeout: 8000 });
  const use = page.getByTestId("use-cart");
  if (await use.count()) await use.click();
}
