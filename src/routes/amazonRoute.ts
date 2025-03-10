import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import amazonScraper from "../scrapers/amazonScraper";
import puppeteerExtra from "puppeteer-extra";
import stealth from "puppeteer-extra-plugin-stealth";

export const amazon = new Hono();
puppeteerExtra.use(stealth());

amazon.post("/", async (c) => {
  const url = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }
  const browser = await puppeteerExtra.launch({ headless: false });
  const page = await browser.newPage();
  const scraper = new amazonScraper(browser, page);

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
  );

  await page.setViewport({ width: 1280, height: 720 }); 

  await scraper.visit(url);
  await scraper.selectCountry();
  const title = await scraper.getTitle();
  const images = await scraper.getImages();
  const price = await scraper.getPrice();

  await browser.close();

  return c.json({ title, price, images });
});
