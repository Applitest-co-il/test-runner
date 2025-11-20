import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class AddValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, item: any): Promise<void> {
        const actualValue = replaceVariables(this.value || '', this.variables || {});
        await item.addValue(actualValue);
    }
}
