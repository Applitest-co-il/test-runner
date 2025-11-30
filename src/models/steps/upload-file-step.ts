import BaseStep from './base-step';
import { TestRunnerError, TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class UploadFileStep extends BaseStep {
    #valueUrl: string = '';
    #valueFilename: string = '';

    constructor(sequence: number, step: TestStep & { valueUrl?: string; valueFilename?: string }) {
        super(sequence, step);
        this.#valueUrl = step.valueUrl || '';
        this.#valueFilename = step.valueFilename || '';

        this.takeSnapshot = true;
    }

    get valueUrl(): string {
        return this.#valueUrl;
    }

    get valueFilename(): string {
        return this.#valueFilename;
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('UploadFileStep: No element provided for upload file action');
        }

        let actualValue = this.value || '';
        const conf = this.conf;
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
