import { error } from "console";
import * as puppeteer from "puppeteer";
import type {
  Characteristic,
  StructuredCharacteristics,
} from "../common/types";

export default class ebayScraper {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  private delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
      throw new Error(`Could not get title: ${error}`);
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
    const numericPrice = parseFloat(parsedPriceCost.replace(/[^\d.]/g, ""));
    return numericPrice;
  }

  // Get shipping
  // costs

  async getShipping(): Promise<number | string> {
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
      const numericShipping = parseFloat(
        parsedShippingCost.replace(/[^\d.]/g, "")
      );
      return numericShipping;
    } catch (error) {
      throw new Error(`Could not get shipping cost: ${error}`);
    }
  }

  // Choose USA as the country and enter the ZIP code 33172
  async selectCountry() {
    // Wait for and hover over the element that opens the country/ZIP modal
    await this.page.waitForSelector(
      ".ux-layout-section__item .ux-action.fake-link.fake-link--action",
      { visible: true }
    );
    await this.page.hover(
      ".ux-layout-section__item .ux-action.fake-link.fake-link--action"
    );
    await this.delay(500);
    await this.page.click(
      ".ux-layout-section__item .ux-action.fake-link.fake-link--action"
    );

    // Wait for and click the country dropdown button
    await this.page.waitForSelector("#shCountry", { visible: true });
    await this.page.hover("#shCountry");
    await this.delay(500);
    await this.page.click("#shCountry");

    // Small delay before selecting the country
    await this.delay(300);
    // Select USA (assuming the value "1" corresponds to USA)
    await this.page.select("#shCountry", "1");
    await this.delay(300);

    // Process the ZIP code input
    const zipInput = await this.page.$("#shZipCode");
    if (zipInput) {
      await this.page.hover("#shZipCode");
      await this.delay(300);
      // Click to select existing content (triple click) and clear it
      await this.page.click("#shZipCode", { clickCount: 3 });
      await this.delay(300);
      await this.page.keyboard.press("Backspace");
      await this.delay(300);
      // Type the ZIP code with a delay between keystrokes
      await this.page.type("#shZipCode", "33172", { delay: 150 });
      await this.delay(500);
      // Wait until the input value is updated
      await this.page.waitForFunction(() => {
        const input = document.querySelector("#shZipCode");
        return input && (input as HTMLInputElement).value === "33172";
      });
    } else {
      console.log("ZIP code input not found. Continuing to next step.");
    }

    // Wait for a moment before clicking the submit button
    await this.delay(300);
    await this.page.waitForSelector(
      ".x-shipping-calculator__getRates button[type='submit'].btn--primary",
      { visible: true }
    );
    await this.page.hover(
      ".x-shipping-calculator__getRates button[type='submit'].btn--primary"
    );
    await this.delay(300);
    await this.page.click(
      ".x-shipping-calculator__getRates button[type='submit'].btn--primary"
    );
    await this.delay(500);

    // Wait for the response that confirms the changes have loaded
    await this.page.waitForResponse(
      (response) =>
        response.url().includes("GET_RATES_MODAL") && response.status() === 200,
      { timeout: 15000 }
    );

    // Wait for the modal's close button, hover and click it
    await this.page.waitForSelector(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button",
      { visible: true }
    );
    await this.page.hover(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button"
    );
    await this.delay(300);
    await this.page.click(
      "body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button"
    );

    // Wait for any navigation that might occur after closing the modal
    await this.page.waitForNavigation({
      waitUntil: "networkidle0",
    });

    await this.delay(500);

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

  async getCharacteristics(): Promise<StructuredCharacteristics> {
    const rows = await this.page.$$(".ux-layout-section-evo__col");
    const characteristics: Characteristic[] = [];
    for (const row of rows) {
      const labelEl = await row.$(".ux-labels-values__labels-content");
      const valueEl = await row.$(".ux-labels-values__values-content");
      if (labelEl && valueEl) {
        const label = await row.$eval(
          ".ux-labels-values__labels-content",
          (el) => el.textContent?.trim()
        );
        const value = await row.$eval(
          ".ux-labels-values__values-content",
          (el) => el.textContent?.trim()
        );
        // Only push if both label and value are non-empty.
        if (label && value) {
          characteristics.push({ label, value });
        }
      }
    }

    // Define a mapping for known characteristics
    const knownLabels: { [key: string]: string } = {
      Estado: "Estado",
      Marca: "Marca",
      Material: "Material",
      Características: "Características",
    };
    // Create two objects: one for known specifications and one for others
    const specifications: { [key: string]: string } = {};
    const otherSpecifications: { [key: string]: string } = {};

    for (const char of characteristics) {
      if (char.label in knownLabels) {
        const key = knownLabels[char.label];
        specifications[key] = char.value;
      } else {
        otherSpecifications[char.label] = char.value;
      }
    }
    return { specifications, otherSpecifications };
  }

  // Get listing's
  // images
  async getImages() {
    const mainImage = await this.page.$eval(
      ".ux-image-carousel-item.image-treatment.active img",
      (img) => img.getAttribute("src")
    );
    let gallery = await this.page.$$eval(
      ".ux-image-carousel-item.image-treatment img",
      (imgs: HTMLImageElement[]) =>
        imgs.map((img) => img.getAttribute("data-zoom-src") || "")
    );

    gallery = Array.from(new Set(gallery));

    return { mainImage, gallery };
  }
}
