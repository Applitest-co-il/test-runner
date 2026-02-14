import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class AssertIsClickableStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('AssertIsClickable: No element provided for assert is clickable action');
        }

        const isClickable = await item.isClickable();
        if (!isClickable) {
            throw new TestRunnerError(
                `AssertIsClickable::Item with ${this.namedElementOrUsedSelectorsComment} was not found or is not displayed`
            );
        }
    }
}
