import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class ClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.hideKeyboard = true;
        this.takeSnapshot = true;
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new Error('ClickStep: No element provided for execute action');
        }

        await item.click();
    }
}
