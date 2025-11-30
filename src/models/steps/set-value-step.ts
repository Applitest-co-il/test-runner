import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError, TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class SetValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('SetValueStep: No element provided for set value action');
        }

        const actualValue = replaceVariables(this.value || '', this.variables || {});
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
