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

  await scraper.visit(url);

  await browser.close();
});
