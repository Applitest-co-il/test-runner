import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

class WaitForNotExistStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const timeout = this.value ? parseInt(this.value, 10) : 5000;
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
                `Element with ${this.namedElementOrUsedSelectorsComment} did not disappear off screen up to ${timeout}ms`
            );
        }
    }
}

export = WaitForNotExistStep;
