import * as puppeteer from 'puppeteer';

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
				'#mainContent > div.vim.d-vi-evo-region > div.vim.x-item-title > h1 > span.ux-textspans.ux-textspans--BOLD'
			);
			return await this.page.$eval(
				'#mainContent > div.vim.d-vi-evo-region > div.vim.x-item-title > h1 > span.ux-textspans.ux-textspans--BOLD',
				(el) => el.innerHTML
			);
		} catch (error) {
			throw new Error(`Could not get price: ${error}`);
		}
	}

	async getPrice() {
		try {
			await this.page.waitForSelector(
				'#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span'
			);
			return await this.page.$eval(
				'#mainContent > div.vim.d-vi-evo-region > div.vim.x-price-section.mar-t-20 > div > div > div.x-price-primary > span',
				(el) => el.innerHTML
			);
		} catch (error) {
			throw new Error(`Could not get price: ${error}`);
		}
	}

	async getShipping() {
		const normalShippingSelector =
			'#mainContent > div.vim.d-vi-evo-region > div.vim.d-shipping-minview.mar-t-20 > div > div > div > div:nth-child(1) > div > div > div > div.ux-labels-values__values.col-9 > div > div:nth-child(1) > span:nth-child(1)';
		const alternativeShippingSelector =
			'#mainContent > div.vim.d-vi-evo-region > div.vim.d-shipping-minview.mar-t-20 > div > div > div > div:nth-child(1) > div > div > div.ux-labels-values__values.col-9 > div > div > span.ux-textspans.ux-textspans--BOLD';
		try {
			return await this.page.$eval(normalShippingSelector, (el) => el.innerHTML);
		} catch (error) {
			try {
				return await this.page.$eval(alternativeShippingSelector, (el) => el.innerHTML);
			} catch (error) {
				throw new Error(`Could not get price: ${error}`);
			}
		}
	}
}
