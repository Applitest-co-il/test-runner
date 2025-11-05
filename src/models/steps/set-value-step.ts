import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class SetValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        const actualValue = replaceVariables(this.getValue || '', this.getVariables || {});
        try {
            await item.setValue(actualValue);
        } catch (error) {
            if ((error as any).name === 'invalid element state') {
                const keys = actualValue.split('');
                await driver.keys(keys);
            } else {
                throw error;
            }
        }
    }
}
