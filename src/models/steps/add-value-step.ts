import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AddValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const actualValue = replaceVariables(this.getValue || '', this.getVariables || {});
        await item.addValue(actualValue);
    }
}
