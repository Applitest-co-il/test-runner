import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class NavigateStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const url = replaceVariables(this.value || '', this.variables || {});

        if (this.operator === 'new') {
            await driver.newWindow(url);
            return;
        } else {
            await driver.url(url);
        }
    }
}
