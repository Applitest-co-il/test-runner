import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class SwitchFrameStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser): Promise<void> {
        const selectors = this.selectors;
        if (selectors.length === 1 && selectors[0] === 'top') {
            await driver.switchFrame(null);
            return;
        }

        const item = await this.selectItem(driver);
        if (!item) {
            throw new TestRunnerError(
                `SwitchFrame::Could not find indicated frame with ${this.namedElementOrUsedSelectorsComment}`
            );
        }
        await driver.switchFrame(item);
    }
}
