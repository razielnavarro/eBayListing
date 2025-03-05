import { error } from "console";
import * as puppeteer from "puppeteer";

export default class BasePage {
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
      await this.page.waitForSelector(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-item-title > h1 > span.ux-textspans.ux-textspans--BOLD"
      );
      return await this.page.$eval(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-item-title > h1 > span.ux-textspans.ux-textspans--BOLD",
        (el) => el.innerHTML
      );
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
  }

  // Get the listing's
  // price
  async getPrice() {
    let price: string;
    try {
      await this.page.waitForSelector(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span"
      );
      price = await this.page.$eval(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span",
        (el) => el.innerHTML
      );
      if (!price.includes("$")) {
        price =
          (await this.page.$eval(
            ".ux-textspans.ux-textspans--SECONDARY.ux-textspans--BOLD",
            (el) => el.textContent?.trim()
          )) || "";
      }
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
    const parsedPriceCost = this.parseDollarValue(price);
    return parsedPriceCost;
  }

  // Get shipping
  // costs

  async getShipping(): Promise<string> {
    try {
      let shippingCost = await this.page.$eval(
        "div.ux-layout-section--shipping div.ux-labels-values--shipping span.ux-textspans.ux-textspans--BOLD",
        (el) => el.textContent?.trim() || ""
      );
      // if shipping shows in a different currency, show amount in USD
      if (!shippingCost.includes("$")) {
        shippingCost = await this.page.$eval(
          "div.ux-layout-section--shipping div.ux-labels-values--shipping span.ux-textspans.ux-textspans--SECONDARY.ux-textspans--BOLD",
          (el) => el.innerHTML
        );
      }
      const parsedShippingCost = this.parseDollarValue(shippingCost);
      return parsedShippingCost;
    } catch (error) {
      throw new Error(`Could not get shipping cost: ${error}`);
    }
  }

  // Choose USA as the
  // country and enter the
  // ZIP code 33172
  async selectCountry() {
    // Enviar a
    await this.page.waitForSelector(
      ".ux-layout-section__item .ux-action.fake-link.fake-link--action"
    );
    await this.page.click(
      ".ux-layout-section__item .ux-action.fake-link.fake-link--action"
    );
    // Button with drop down
    await this.page.waitForSelector("#shCountry");
    await this.page.click("#shCountry");

    // Select USA
    await this.page.select("#shCountry", "1");

    // Select ZIP code
    const zipInput = await this.page.$("#shZipCode");
    if (zipInput) {
      await this.page.click("#shZipCode", { clickCount: 3 });
      await this.page.keyboard.press("Backspace");
      await this.page.type("#shZipCode", "33172");
    }

    // Submit button
    await this.page.waitForSelector(
      ".x-shipping-calculator__getRates button[type='submit'].btn--primary"
    );
    await this.page.click(
      ".x-shipping-calculator__getRates button[type='submit'].btn--primary"
    );
    await this.page.waitForResponse(
      (response) =>
        response.url().includes("GET_RATES_MODAL") && response.status() === 200,
      { timeout: 15000 }
    ); // Wait for changes to load

    // Close the modal
    await this.page.waitForSelector(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button"
    );
    await this.page.click(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button"
    );

    // Wait for the page to fully load
    await this.page.waitForSelector(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river",
      { hidden: true }
    );
    await this.page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 15000,
    });
    await this.page.content();
  }

  // Select spanish as the
  // default language
  async selectLanguage() {
    const currentLanguage = await this.page.$eval(
      ".gh-language-toggle__menu-text",
      (el) => el.getAttribute("data-lang")
    );
    if (currentLanguage !== "es-CO") {
      // Wait for the Spanish language option to appear
      await this.page.waitForSelector(
        'span.gh-language-toggle__list-text[data-lang="es-CO"]'
      );

      // Click the Spanish option
      await this.page.click(
        'span.gh-language-toggle__list-text[data-lang="es-CO"]'
      );
    }
  }

  // Get listing's
  // details
  async getCharacteristics() {
    const rows = await this.page.$$(".ux-layout-section-evo__col");
    const characteristics = [];
    for (const row of rows) {
      try {
        const label = await row.$eval(
          ".ux-labels-values__labels-content",
          (el) => el.textContent?.trim()
        );
        const value = await row.$eval(
          ".ux-labels-values__values-content",
          (el) => el.textContent?.trim()
        );
        characteristics.push({ label, value });
      } catch (error) {
        console.log(`Could not get details: ${error}`);
      }
    }
    return characteristics;
  }

  // Get listing's
  // images
  async getImages() {
    const mainImage = await this.page.$eval(
      ".ux-image-carousel-item.image-treatment.active img",
      (img) => img.getAttribute("src")
    );
    let imageUrls = await this.page.$$eval(
      ".ux-image-carousel-item.image-treatment img",
      (imgs: HTMLImageElement[]) =>
        imgs.map((img) => img.getAttribute("data-zoom-src") || "")
    );

    imageUrls = Array.from(new Set(imageUrls));

    return { mainImage, imageUrls };
  }
}
