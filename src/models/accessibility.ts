import { Browser, ChainablePromiseElement } from 'webdriverio';
import { logger } from '../helpers/log-service';

export class Accessibility {
    private readonly _driver: Browser;

    constructor(driver: Browser) {
        this._driver = driver;
    }

    get driver(): Browser {
        return this._driver;
    }

    public async getAxTree(selector?: string): Promise<any> {
        const puppeteerBrowser = await this.driver.getPuppeteer();

        // switch to Puppeteer context
        const axTree = await this.driver.call(async () => {
            try {
                const pages = await puppeteerBrowser.pages();
                const page = pages[0];

                if (selector) {
                    // Get accessibility snapshot for specific element
                    const element = await page.$(selector);
                    if (!element) {
                        throw new Error(`Element not found for selector: ${selector}`);
                    }
                    return page.accessibility.snapshot({ root: element });
                } else {
                    // Get accessibility snapshot for entire page
                    return page.accessibility.snapshot();
                }
            } catch (error) {
                logger.error(`Error getting accessibility tree: ${(error as Error).message}`);
                return null;
            }
        });

        return axTree;
    }

    private findProperty(node: any, attr: string, recursive: boolean = false): any {
        if (node && node[attr] !== undefined) {
            return node[attr];
        }

        if (recursive && node.children) {
            for (const child of node.children) {
                const result = this.findProperty(child, attr);
                if (result !== undefined) {
                    return result;
                }
            }
        }

        return undefined;
    }

    public async getAxProperty(selector: string, attribute: string, recursive: boolean = false): Promise<any> {
        if (!selector) {
            throw new Error('Selector is required to get accessibility attribute');
        }

        const axTree = await this.getAxTree(selector);
        if (!axTree) {
            throw new Error('Could not retrieve accessibility tree');
        }

        const propertyValue = this.findProperty(axTree, attribute, recursive);
        return propertyValue !== undefined ? String(propertyValue) : null;
    }
}
