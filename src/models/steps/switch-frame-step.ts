import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class SwitchFrameStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser): Promise<void> {
        const selectors = this.getSelectors;
        if (selectors.length === 1 && selectors[0] === 'top') {
            await driver.switchFrame(null);
            return;
        }

        const item = await this.selectItem(driver);
        if (!item) {
            throw new TestRunnerError(
                `SwitchFrame::Could not find indicated frame with ${this.getNamedElementOrUsedSelectorsComment}`
            );
        }
        await driver.switchFrame(item);
    }
}
