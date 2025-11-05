import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class NavigateStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const url = replaceVariables(this.getValue || '', this.getVariables || {});

        if (this.getOperator === 'new') {
            await driver.newWindow(url);
            return;
        } else {
            await driver.url(url);
        }
    }
}
