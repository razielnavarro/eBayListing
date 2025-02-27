import * as puppeteer from "puppeteer";

export default class BasePage {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  constructor(browser: puppeteer.Browser, page: puppeteer.Page) {
    this.browser = browser;
    this.page = page;
  }

  async visit(url: string) {
    await this.page.goto(url);
  }

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

  async getPrice() {
    try {
      await this.page.waitForSelector(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span"
      );
      return await this.page.$eval(
        "#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span",
        (el) => el.innerHTML
      );
    } catch (error) {
      throw new Error(`Could not get price: ${error}`);
    }
  }

  async getShipping() {
    const normalShippingSelector =
      "#mainContent > div.vim.d-vi-evo-region > div.vim.d-shipping-minview.mar-t-20 > div > div > div > div:nth-child(1) > div > div > div > div.ux-labels-values__values.col-9 > div > div:nth-child(1) > span:nth-child(1)";
    const alternativeShippingSelector =
      "#mainContent > div.vim.d-vi-evo-region > div.vim.d-shipping-minview.mar-t-20 > div > div > div > div:nth-child(1) > div > div > div.ux-labels-values__values.col-9 > div > div > span.ux-textspans.ux-textspans--BOLD";
    try {
		await this.page.content();
		return await this.page.$eval(
        normalShippingSelector,
        (el) => el.innerHTML
      );
    } catch (error) {
      try {
        return await this.page.$eval(
          alternativeShippingSelector,
          (el) => el.innerHTML
        );
      } catch (error) {
        throw new Error(`Could not get price: ${error}`);
      }
    }
  }

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
    await this.page.waitForSelector("#shZipCode");
    await this.page.click("#shZipCode", { clickCount: 3 });
    await this.page.keyboard.press("Backspace");
    await this.page.type("#shZipCode", "33172");

    // Submit button
    await this.page.waitForSelector(".x-shipping-calculator__getRates button[type='submit'].btn--primary");
    await this.page.click(".x-shipping-calculator__getRates button[type='submit'].btn--primary");
	await this.page.waitForResponse((response) => response.url().includes('GET_RATES_MODAL') && response.status() === 200, { timeout: 15000 })	// Wait for changes to load

	// Close the modal
	await this.page.waitForSelector('body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button');
	await this.page.click('body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river > div > div > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__header > button');

	// Wait for the page to fully load
	await this.page.waitForSelector('body > div.vi-evo > main > div.main-container > div.vim.x-vi-evo-main-container.template-evo-avip > div.x-evo-overlay-river', { hidden: true });
	await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
  }
}
