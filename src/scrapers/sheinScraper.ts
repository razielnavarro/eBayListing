import puppeteerExtra from "puppeteer-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import * as puppeteer from "puppeteer";

puppeteerExtra.use(stealth());

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
  //   async closePopup() {
  //     let closeButton;
  //     try {
  //       // Wait for <body> to get the class indicating the popup is active
  //       await this.page.waitForFunction(
  //         () => document.body.classList.contains("sui-popup-parent__hidden"),
  //         { timeout: 10000 }
  //       );

  //       // Optional delay for the popup to fully load
  //       await this.delay(5000);

  //       // Selector for the close button
  //       closeButton =
  //         "body > div.j-vue-coupon-package-container.c-vue-coupon > div > div.sui-dialog.coupon-dialog > div > div > div.sui-dialog__body > div > div.dialog-header-v2 > div.dialog-header-v2__close-btn > svg";

  //       // Wait for the close button to appear
  //       await this.page.waitForSelector(closeButton, { timeout: 10000 });

  //       // Hover over and click the close button
  //       await this.page.hover(closeButton);
  //       await this.page.click(closeButton);
  //       console.log("Popup closed successfully!");

  //       // Wait for the popup to disappear, e.g., by waiting for the body class to be removed or a key element to be visible
  //       await this.page.waitForFunction(
  //         () => !document.body.classList.contains("sui-popup-parent__hidden"),
  //         { timeout: 10000 }
  //       );

  //       // Alternatively, wait for a main content element to appear again
  //       await this.page.waitForSelector("#goods-detail-v3", { timeout: 10000 });
  //     } catch (error) {
  //       console.log("Popup did not appear or an error occurred:", error);
  //     }
  //   }

  // Get listing's
  // item title
  async getTitle() {
    let initialTitle: string;
    try {
      await this.page.waitForSelector(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > h1"
      );
      initialTitle = await this.page.$eval(
        "#goods-detail-v3 > div.goods-detailv2 > div.goods-detailv2__media > div > div.product-intro > div.product-intro__info > div.product-intro__info-sticky > div.product-intro__head.j-expose__product-intro__head > h1",
        (el) => el.innerHTML.trim()
      );
    } catch (error) {
      throw new Error(`Could not get title: ${error}`);
    }
    const title = initialTitle.replace(/<!--.*?-->/g, "").trim();
    return title;
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

  //   Get categories
  async getCategories() {
    // Get all the breadcrumb links
    const items = await this.page.$$(
      ".bread-crumb__item .bread-crumb__item-link"
    );

    // Slice off the first and last (items.slice(1, -1)) and then iterate
    const categories = [];
    for (const item of items.slice(1, -1)) {
      await this.delay(200); // if you still need this delay
      const category = await item.evaluate((el) =>
        el.textContent ? el.textContent.trim() : ""
      );
      categories.push(category);
    }

    return categories;
  }

  // Get listing's
  // images
  async getImages() {
    const items = await this.page.$$(
      ".product-intro__thumbs-item .crop-image-container"
    );
    const imageURLs: string[] = [];

    for (const item of items) {
      // optional delay if needed
      await this.delay(200);

      // Grab the data-before-crop-src
      const imageURL = await item.$eval(
        ".crop-image-container img",
        (img) => (img as HTMLImageElement).src
      );

      // Push into our array
      if (imageURL) {
        imageURLs.push(imageURL);
      }
    }

    // Now remove duplicates
    const uniqueImages = Array.from(new Set(imageURLs));

    // Typically the first image is the "main" one
    const [mainImage, ...gallery] = uniqueImages;

    return { mainImage, gallery };
  }

  //   get sizes
  async getSizes() {
    const sizes = await this.page.$$(
      ".sui-popover__trigger.product-intro__size-radio-spopover"
    );

    if (sizes.length === 0) {
      return "not available";
    }

    const sizesContainer: string[] = [];

    for (const size of sizes) {
      await this.delay(200);

      const sizeText = await size.$eval(
        "div.product-intro__size-radio.fsp-element",
        (el) => el.getAttribute("aria-label")
      );
      if (sizeText) {
        sizesContainer.push(sizeText);
      }
    }
    return { sizesContainer };
  }

  //   get colors
  async getColors() {
    const colorTriggers = await this.page.$$(
      "span.sui-popover__trigger[data-v-f25fb043]"
    );

    if (colorTriggers.length === 0) {
      return "not available";
    }

    const colorsContainer = [];

    for (const trigger of colorTriggers) {
      await this.delay(200);

      const radioElement = await trigger.$(
        "div.goods-color__radio.goods-color__radio_block, div.goods-color__radio.goods-color__radio_radio"
      );
      if (!radioElement) {
        continue;
      }

      const colorText = await radioElement.evaluate((el) =>
        el.getAttribute("aria-label")
      );

      const imageElement = await radioElement.$(
        "img.crop-image-container__img"
      );
      let imageUrl = "";
      if (imageElement) {
        imageUrl =
          (await imageElement.evaluate((img) => img.getAttribute("src"))) || "";
        if (imageUrl && imageUrl.startsWith("//")) {
          imageUrl = "https:" + imageUrl;
        }
      }

      if (colorText) {
        colorsContainer.push({ color: colorText, image: imageUrl });
      }
    }
    return { colorsContainer };
  }

  async getSeller() {
    let seller: string;
    try {
      seller = await this.page.$eval(
        ".soldbybox-header__title-text",
        (el) => el.textContent || ""
      );
    } catch (error) {
      throw new Error(`Could not get seller: ${error}`);
    }
    const match = seller.match(/^Sold by\s*(.+)/i);
    if (match) {
      return match[1].trim();
    }
    return seller;
  }
}
