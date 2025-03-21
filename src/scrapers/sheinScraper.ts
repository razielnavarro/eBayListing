import puppeteerExtra from "puppeteer-extra";

// Extend the Window interface to include gbRawData
declare global {
  interface Window {
    gbRawData: any;
  }
}
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
    // Select the full-size image containers from the main gallery
    const items = await this.page.$$(
      ".product-intro__main-item .crop-image-container"
    );
    const imageURLs: string[] = [];
  
    for (const item of items) {
      // Optional delay if needed
      await this.delay(200);
  
      // Extract the full-size URL from the data-before-crop-src attribute
      const imageURL = await item.evaluate(el => el.getAttribute("data-before-crop-src"));
      
      // Prepend "https:" if the URL starts with "//"
      const finalURL = imageURL && imageURL.startsWith("//")
        ? `https:${imageURL}`
        : imageURL;
      
      if (finalURL) {
        imageURLs.push(finalURL);
      }
    }
  
    // Remove duplicates
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
  
    const sizesContainer = [];
  
    for (const size of sizes) {
      await this.delay(200);
  
      const sizeData = await size.$eval(
        "div.product-intro__size-radio.fsp-element",
        (el) => {
          // Get the size label
          const label = el.getAttribute("aria-label");
          // Check if the sold-out class is present
          const soldOut = el.classList.contains("product-intro__size-radio_soldout");
          return { label, soldOut };
        }
      );
  
      if (sizeData.label) {
        sizesContainer.push(sizeData);
      }
    }
    return { sizesContainer };
  }
  

  //   get colors
  async getColors() {
    const colorIdentifiers = await this.page.$$(
      "span.sui-popover__trigger[data-v-f25fb043]"
    );

    if (colorIdentifiers.length === 0) {
      return "not available";
    }

    const colorsContainer = [];

    for (const colorEl of colorIdentifiers) {
      await this.delay(200);

      const goodsId = await colorEl.evaluate((el) =>
        el.getAttribute("goods-id")
      );

      const labelEl = await colorEl.$(
        "div.goods-color__radio.goods-color__radio_block, div.goods-color__radio.goods-color__radio_radio"
      );
      if (!labelEl) continue;

      const colorText = await labelEl.evaluate((el) =>
        el.getAttribute("aria-label")
      );

      colorsContainer.push({ goodsId, colorText, sku: null, image: null });
    }

    const gbRawData = await this.page.evaluate(() => window.gbRawData);

    const relationColors = gbRawData?.productIntroData?.relation_color || [];

    for (const colorItem of colorsContainer) {
      const matchingColorObj = relationColors.find(
        (relColor: { goods_id: string | number }) =>
          String(relColor.goods_id) === String(colorItem.goodsId)
      );

      if (matchingColorObj) {
        colorItem.sku = matchingColorObj.goods_sn;

        let imageUrl = matchingColorObj.original_img || "";
        if (imageUrl.startsWith("//")) {
          imageUrl = "https:" + imageUrl;
        }
        colorItem.image = imageUrl;
      }
    }

    const finalColors = colorsContainer.map(({ colorText, sku, image }) => ({
      colorText,
      sku,
      image,
    }));

    return finalColors.slice(1);
  }

  // Get the seller's info
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

  // Get reviews info
  async getReviews() {
    const ratingText = await this.page.$eval(
      ".rate-num-small",
      (el) => el.textContent
    );

    if (!ratingText) {
      throw new Error("Rating text is null or undefined");
    }

    const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || "0");
    const totalReviewsText = await this.page.$eval(
      ".product-intro__head-reviews-text",
      (el) => el.textContent
    );
    const totalReviews = parseInt(
      totalReviewsText?.match(/[\d,]+/)?.[0]?.replace(/,/g, "") || "0",
      10
    );
    return { rating, totalReviews };
  }

  //   get item details
  async getFeatures(): Promise<{ [key: string]: string }> {
    const rows = await this.page.$$(".product-intro__description-table-item");
    const features: { [key: string]: string } = {};

    for (const row of rows) {
      const labelEl = await row.$(".key");
      const valueEl = await row.$(".val");
      if (labelEl && valueEl) {
        let label = await row.$eval(".key", (el) => el.textContent?.trim());
        const value = await row.$eval(".val", (el) => el.textContent?.trim());
        if (label && value) {
          features[label] = value;
        }
      }
    }
    return features;
  }
}

