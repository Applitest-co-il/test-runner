import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class AssertIsDisplayedStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('AssertIsDisplayed: No element provided for assert is displayed action');
        }

        const isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(
                `AssertIsDisplayed::Item with ${this.namedElementOrUsedSelectorsComment} was not found or is not displayed`
            );
        }
    }
}
