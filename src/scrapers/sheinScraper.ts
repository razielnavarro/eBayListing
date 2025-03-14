import puppeteerExtra from "puppeteer-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import * as puppeteer from "puppeteer";

// puppeteerExtra.use(stealth());

export default class sheinScraper {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  constructor(browser: puppeteer.Browser, page: puppeteer.Page) {
    this.browser = browser;
    this.page = page;
  }

  private delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

  //   Close pop up if visible
  async closePopup() {
    const popUp = await this.page.$(".sui-popup-parent__hidden");
    if (popUp) {
      await this.delay(700);
      await this.page.click(
        ".body > div.j-vue-coupon-package-container.c-vue-coupon > div > div.sui-dialog.coupon-dialog > div > div > div.sui-dialog__body > div > div.dialog-header-v2 > div.dialog-header-v2__close-btn > svg"
      );
    } else {
      console.log("No pop up found");
    }
  }

  // Get listing's
  // item title
  async getTitle() {
    try {
      await this.page.waitForSelector(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > h1"
      );
      return await this.page.$eval(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > h1",
        (el) => el.innerHTML.trim()
      );
    } catch (error) {
      throw new Error(`Could not get title: ${error}`);
    }
  }

  // Get the listing's
  // price

  async getPrice() {
    let price: string;
    try {
      await this.page.waitForSelector(
        "#productIntroPrice > div > div > div > div > div.from.original"
      );
      price = await this.page.$eval(
        "#productIntroPrice > div > div > div > div > div.from.original",
        (el) => el.innerHTML
      );
      const parsedPriceCost = this.parseDollarValue(price);
      const numericPrice = parseFloat(parsedPriceCost.replace(/[^\d.]/g, ""));
      return numericPrice;
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
  }

  // Get SKU
  async getSku() {
    let initialSku: string;
    try {
      await this.page.waitForSelector(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > div.product-intro__head-sku-ctn > div.product-intro__head-sku > span.product-intro__head-sku-text"
      );
      initialSku = await this.page.$eval(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > div.product-intro__head-sku-ctn > div.product-intro__head-sku > span.product-intro__head-sku-text",
        (el) => el.innerHTML
      );
    } catch (error) {
      throw new Error(`Could not get SKU: ${error}`);
    }
    const match = initialSku.match(/(?<=:\s*)\S+/);
    if (match) {
      const sku = match[0];
      return sku;
  }
}
}
