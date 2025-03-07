import puppeteerExtra from "puppeteer-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import * as puppeteer from "puppeteer";

puppeteerExtra.use(stealth());

export default class amazonScraper {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  constructor(browser: puppeteer.Browser, page: puppeteer.Page) {
    this.browser = browser;
    this.page = page;
  }

  // Helper function to parse the shipping cost string
  private parseDollarValue(text: string): string {
    // This regex finds a dollar sign followed by the number with optional decimals.
    const regex = /\$\s*\d+(?:[.,]\d+)?/;
    const match = text.match(regex);
    return match ? match[0].replace(/\s+/g, "") : text;
  }

  async visit(url: string) {
    await this.page.goto(url);
  }

  // Get listing's
  // item title
  async getTitle() {
    try {
      await this.page.waitForSelector("#productTitle");
      return await this.page.$eval("#productTitle", (el) => el.innerHTML);
    } catch (error) {
      throw new Error(`Could not get title: ${error}`);
    }
  }

  // Get the listing's
  // price

  async getPrice(){
    let price: string;
    try {
      await this.page.waitForSelector("div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen");
      price = await this.page.$eval("div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen", (el) => el.innerHTML);
      const parsedPriceCost = this.parseDollarValue(price);
      const numericPrice = parseFloat(parsedPriceCost.replace(/[^\d.]/g, ""));
      return numericPrice;
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
  }
}
