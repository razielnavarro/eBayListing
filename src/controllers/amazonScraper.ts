import { Hono } from "hono";
import * as puppeteer from "puppeteer";
import AmazonPage from "../pages/amazonScraping";

export const amazonScraper = new Hono();

amazonScraper.post("/", async (c) => {
  const url = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const amazonPage = new AmazonPage(browser, page);

  await amazonPage.visit(url);

  await browser.close();

});
