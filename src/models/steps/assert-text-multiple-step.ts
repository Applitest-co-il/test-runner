import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { compareTextValues } from '../../helpers/text-comparison';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class AssertTextMultipleStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const items = await this.selectItems(driver);

        if (!items || (await items.length) === 0) {
            throw new TestRunnerError('AssertTextMultiple: No elements found for assert text multiple action');
        }

        const expectedValue = replaceVariables(this.value || '', this.variables || {});
        const operator = this.operator || '==';

        for (const item of items) {
            const text = await item.getText();
            compareTextValues(
                text,
                expectedValue,
                operator,
                'AssertMultipleText',
                ` on element with ${this.namedElementOrUsedSelectorsComment}`
            );
        }
    }
}
