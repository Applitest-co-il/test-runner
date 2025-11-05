import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

class WaitForNotExistStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _?: any): Promise<void> {
        const timeout = this.getValue ? parseInt(this.getValue, 10) : 5000;
        try {
            await driver.waitUntil(
                async () => {
                    const item = await this.selectItem(driver);
                    if (item) {
                        await this.addFrameToVideo(true);
                        return false;
                    } else {
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch {
            throw new TestRunnerError(
                `Element with ${this.getNamedElementOrUsedSelectorsComment} did not disappear off screen up to ${timeout}ms`
            );
        }
    }
}

export = WaitForNotExistStep;
