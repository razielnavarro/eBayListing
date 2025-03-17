import { Hono } from "hono";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import sheinScraper from "../scrapers/sheinScraper";

// Use the stealth plugin to mask automation fingerprints
puppeteer.use(StealthPlugin());

export const shein = new Hono();

export async function sheinScraperHandler(url: string) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();

  // Override navigator.webdriver before any script runs
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
  );

  const scraper = new sheinScraper(browser, page);
  await scraper.visit(url);
  //   await scraper.closePopup();

  const title = await scraper.getTitle();
  const price = await scraper.getPrice();
  const sku = await scraper.getSku();
  const categories = await scraper.getCategories();
  const images = await scraper.getImages();
  const sizes = await scraper.getSizes();
  const colors = await scraper.getColors();
  const seller = await scraper.getSeller();
  const reviews = await scraper.getReviews();
  const characteristics = await scraper.getCharacteristics();

  await browser.close();

  return { title, sku, price, seller, reviews, categories, sizes, colors, characteristics,images };
}
