import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class WaitForExistStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const value = this.getValue;
        let timeout = value ? parseInt(value) : 5000;
        try {
            let that = this;
            await driver.waitUntil(
                async () => {
                    let item = await that.selectItem(driver);
                    if (!item) {
                        await that.addFrameToVideo(true);
                        return false;
                    } else {
                        await that.highlightElement(driver, item);
                        await driver.pause(500);
                        await that.revertElement(driver, item);
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch {
            throw new TestRunnerError(
                `Element with ${this.getNamedElementOrUsedSelectorsComment} did not appear on screen up to ${timeout}ms`
            );
        }
    }
}
