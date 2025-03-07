import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import ebayScraper from "../scrapers/ebayScraper";

export const ebay = new Hono();

ebay.post("/", async (c) => {
  const url = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const scraper = new ebayScraper(browser, page);

  await scraper.visit(url);
  await scraper.selectLanguage();
  await scraper.selectCountry();

  const title = await scraper.getTitle();

  const images = await scraper.getImages();
  const price = await scraper.getPrice();
  const shipping = await scraper.getShipping();
  const specifications = await scraper.getCharacteristics();

  await browser.close();

  return c.json({ title, price, shipping, specifications, images });
});
