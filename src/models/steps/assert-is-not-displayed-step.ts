import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class AssertIsNotDisplayedStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser): Promise<void> {
        const item = await this.selectItem(driver);
        if (!item) {
            return;
        }
        let isDisplayed = await item.isDisplayed();
        if (isDisplayed) {
            await this.highlightElement(driver, item);
            await this.addFrameToVideo();
            await this.revertElement(driver, item);
            throw new TestRunnerError(
                `AssertIsNotDisplayed::Item with ${this.namedElementOrUsedSelectorsComment} is displayed`
            );
        }
    }
}
