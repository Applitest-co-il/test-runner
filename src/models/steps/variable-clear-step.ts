import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class VariableClearStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(__: Browser, _: any): Promise<void> {
        const varName = this.value;
        const variables = this.variables || {};
        if (varName && variables[varName]) {
            delete variables[varName];
        }
    }
}
