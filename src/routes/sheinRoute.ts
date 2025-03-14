import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import sheinScraper from "../scrapers/sheinScraper";

export const shein = new Hono();

export async function sheinScraperHandler(url: string) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const scraper = new sheinScraper(browser, page);

  await scraper.visit(url);

  const title = await scraper.getTitle();
  const price = await scraper.getPrice();

  await browser.close();

  return { title, price };
}
