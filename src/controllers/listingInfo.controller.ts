import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import BasePage from "../pages/BasePage";

export const listingInfo = new Hono();

listingInfo.post("/", async (c) => {
  const url = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const basePage = new BasePage(browser, page);

  await basePage.visit(url);
  await basePage.selectCountry();

  const title = await basePage.getTitle();
  const price = await basePage.getPrice();
  const shipping = await basePage.getShipping();

  await browser.close();

  return c.json({ title, price, shipping });
});