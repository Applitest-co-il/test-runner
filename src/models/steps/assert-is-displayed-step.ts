import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AssertIsDisplayedStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(
                `AssertIsDisplayed::Item with ${this.getNamedElementOrUsedSelectorsComment} was not found or is not displayed`
            );
        }
    }
}
