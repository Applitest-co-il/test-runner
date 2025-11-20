import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class WaitForExistStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: any): Promise<void> {
        const value = this.value;
        let timeout = value ? parseInt(value) : 5000;
        try {
            await driver.waitUntil(
                async () => {
                    let item = await this.selectItem(driver);
                    if (!item) {
                        await this.addFrameToVideo(true);
                        return false;
                    } else {
                        await this.highlightElement(driver, item);
                        await driver.pause(500);
                        await this.revertElement(driver, item);
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch {
            throw new TestRunnerError(
                `Element with ${this.namedElementOrUsedSelectorsComment} did not appear on screen up to ${timeout}ms`
            );
        }
    }
}
