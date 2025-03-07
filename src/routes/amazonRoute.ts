import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import amazonScraper from "../scrapers/amazonScraper";

export const amazon = new Hono();

amazon.post("/", async (c) => {
  const url = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const scraper = new amazonScraper(browser, page);

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
  );

  await scraper.visit(url);
  const title = await scraper.getTitle();
  const price = await scraper.getPrice();

  await browser.close();

  return c.json({ title, price });
});
