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
      return await this.page.$eval("#productTitle", (el) =>
        el.innerHTML.trim()
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
        "div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen"
      );
      price = await this.page.$eval(
        "div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen",
        (el) => el.innerHTML
      );
      const parsedPriceCost = this.parseDollarValue(price);
      const numericPrice = parseFloat(parsedPriceCost.replace(/[^\d.]/g, ""));
      return numericPrice;
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
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

  // Choose USA as the
  // country and enter the
  // ZIP code 33172
  async selectCountry() {
    // Helper function for a manual delay
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Open the location popover with human-like behavior
    await this.page.waitForSelector("#nav-global-location-popover-link", {
      visible: true,
    });
    await this.page.hover("#nav-global-location-popover-link");
    await delay(500); // Pause to simulate human reaction time
    await this.page.click("#nav-global-location-popover-link");

    await delay(500); // Pause after opening the popover

    // Wait for and type the ZIP code with a delay to simulate human typing
    await this.page.waitForSelector("#GLUXZipUpdateInput", { visible: true });
    await this.page.click("#GLUXZipUpdateInput");
    await delay(300);
    await this.page.type("#GLUXZipUpdateInput", "33172", { delay: 150 });
    await delay(500);

    // Wait for the apply button to be visible and click it
    await this.page.waitForSelector(
      'input[aria-labelledby="GLUXZipUpdate-announce"]',
      { visible: true }
    );
    await this.page.hover('input[aria-labelledby="GLUXZipUpdate-announce"]');
    await delay(300);
    await this.page.click('input[aria-labelledby="GLUXZipUpdate-announce"]');

    // Wait for the update process to complete
    await delay(2000);

    // Close the modal
    await this.page.waitForSelector(
      'div.a-popover-wrapper header.a-popover-header button[data-action="a-popover-close"]',
      {
        visible: true,
      }
    );
    await this.page.hover(
      'div.a-popover-wrapper header.a-popover-header button[data-action="a-popover-close"]'
    );
    await delay(300);
    await this.page.click(
      'div.a-popover-wrapper header.a-popover-header button[data-action="a-popover-close"]'
    );

    // Wait for navigation if the modal closing triggers a page load (use try-catch in case it doesn't)
    try {
      await this.page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 10000,
      });
    } catch (error) {}

    return await this.page.content();
  }

  // Select spanish as the
  // default language
  async selectLanguage() {
    const currentLanguage = await this.page.$eval("#icp-nav-flyout", (el) =>
      el.getAttribute("aria-label")
    );
    if (
      currentLanguage !==
      "Elige un idioma para comprar en Amazon Estados Unidos. La selección actual es Español (ES)"
    ) {
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
  // images
  async getImages() {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // 1) Click the main image to open the modal.
    await this.page.click("li.image.item.itemNo0.maintain-height.selected");
    // Wait for the modal’s large image container to appear.
    await this.page.waitForSelector("#ivLargeImage img");

    // 2) Gather all thumbnails from all rows in the modal.
    //    Each row has an id like "ivRow", and inside it are divs with class "ivThumb".
    const rows = await this.page.$$(".ivRow"); // or a more general "div.ivRow" selector if needed

    const imageURLs = [];

    for (const row of rows) {
      // Get all thumbnails in this row
      const thumbs = await row.$$(".ivThumb");
      for (const thumb of thumbs) {
        await delay(300);
        // 3) Click the thumbnail to make it the "selected" image.
        await thumb.click();

        // 4) Wait for the large image to update (and be visible).
        await this.page.waitForSelector("#ivLargeImage img", { visible: true });

        // Now scrape the large image URL
        await delay(200);
        const largeUrl = await this.page.$eval(
          "#ivLargeImage img",
          (img) => img.src
        );
        imageURLs.push(largeUrl);
      }
    }

    // Remove duplicates
    const uniqueImages = Array.from(new Set(imageURLs));

    // The first one in `uniqueImages` is typically the main image (already clicked),
    // but you can separate it out if needed:
    const [mainImage, ...gallery] = uniqueImages;

    return {
      mainImage,
      gallery,
    };
  }

  // Get item's reviews

  async getReviews() {
    await this.page.waitForSelector(
      "#acrPopover > span.a-declarative > a > span"
    );
    const ratingText = await this.page.$eval(
      "#acrPopover > span.a-declarative > a > span",
      (el) => el.textContent
    );

    if (!ratingText) {
      throw new Error("Rating text is null or undefined");
    }

    const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || "0");
    await this.page.waitForSelector("#acrCustomerReviewText");
    const totalReviewsText = await this.page.$eval(
      "#acrCustomerReviewText",
      (el) => el.textContent
    );
    const totalReviews = parseInt(
      totalReviewsText?.match(/[\d,]+/)?.[0]?.replace(/,/g, "") || "0",
      10
    );
    return { rating, totalReviews };
  }
}
