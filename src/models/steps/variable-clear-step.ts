import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class VariableClearStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(__: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const varName = this.value;
        const variables = this.variables || {};
        if (varName && variables[varName]) {
            delete variables[varName];
        }
    }
}
