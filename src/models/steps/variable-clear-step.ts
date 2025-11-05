import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class VariableClearStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(__: ExtendedBrowser, _: any): Promise<void> {
        const varName = this.getValue;
        const variables = this.getVariables || {};
        if (varName && variables[varName]) {
            delete variables[varName];
        }
    }
}
