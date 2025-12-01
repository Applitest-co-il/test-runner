import { Browser, ChainablePromiseElement } from 'webdriverio';
import { TestStep } from '../../types';
import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { compareTextValues } from '../../helpers/text-comparison';

export default class AssertCurrentTitleStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const expectedValue = replaceVariables(this.value || '', this.variables || {});
        const operator = this.operator || '==';

        const currentTitle = await driver.getTitle();

        compareTextValues(currentTitle, expectedValue, operator, 'AssertCurrentTitle');
    }
}
