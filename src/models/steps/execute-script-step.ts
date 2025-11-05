import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class ExecuteScriptStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<any> {
        const script = replaceVariables(this.getValue || '', this.getVariables || {});
        return await this.executeScript(script, driver);
    }
}
