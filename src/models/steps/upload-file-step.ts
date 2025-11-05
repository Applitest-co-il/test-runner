import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class UploadFileStep extends BaseStep {
    #valueUrl: string = '';
    #valueFilename: string = '';

    constructor(sequence: number, step: TestStep & { valueUrl?: string; valueFilename?: string }) {
        super(sequence, step);
        this.#valueUrl = step.valueUrl || '';
        this.#valueFilename = step.valueFilename || '';

        this.setTakeSnapshot = true;
    }

    get valueUrl(): string {
        return this.#valueUrl;
    }

    get valueFilename(): string {
        return this.#valueFilename;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        let actualValue = this.getValue || '';
        const conf = this.getConf;
        if (conf?.farm !== 'local') {
            actualValue = await driver.uploadFile(actualValue);
        }

        const isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            await driver.execute(
                // assign style to elem in the browser
                (el: any) => (el.style.display = 'block'),
                // pass in element so we don't need to query it again in the browser
                item
            );
            await item.waitForDisplayed();
        }
        await item.setValue(actualValue);
    }
}
