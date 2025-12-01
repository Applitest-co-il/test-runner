import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { compareTextValues } from '../../helpers/text-comparison';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class AssertTextStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('AssertText: No element provided for assert text action');
        }
        const text = await item.getText();
        const expectedValue = replaceVariables(this.value || '', this.variables || {});
        const operator = this.operator || '==';

        compareTextValues(
            text,
            expectedValue,
            operator,
            'AssertText',
            ` on element with ${this.namedElementOrUsedSelectorsComment}`
        );
    }
}
