import { Browser } from 'webdriverio';
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

    public async getAxPropertyValues(
        selector: string,
        attribute: string,
        recursive: boolean = false
    ): Promise<string[]> {
        if (!selector) {
            throw new Error('Selector is required to get accessibility attribute');
        }

        const axTree = await this.getAxTree(selector);
        if (!axTree) {
            throw new Error('Could not retrieve accessibility tree');
        }

        const possibleValuesInTree: string[] = [];

        if (axTree && axTree[attribute] !== undefined) {
            possibleValuesInTree.push(String(axTree[attribute]));
        }

        if (recursive && axTree.children) {
            for (const child of axTree.children) {
                if (child && child[attribute] !== undefined) {
                    possibleValuesInTree.push(String(child[attribute]));
                }
            }
        }

        return possibleValuesInTree;
    }
}
