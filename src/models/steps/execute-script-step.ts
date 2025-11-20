import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ExecuteScriptStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: any): Promise<any> {
        const script = replaceVariables(this.value || '', this.variables || {});
        return await this.executeScript(script, driver);
    }
}
