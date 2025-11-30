import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError, TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class AddValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('AddValue: No element provided for add value action');
        }

        const actualValue = replaceVariables(this.value || '', this.variables || {});
        await item.addValue(actualValue);
    }
}
