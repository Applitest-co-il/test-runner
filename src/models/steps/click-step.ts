import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.hideKeyboard = true;
        this.takeSnapshot = true;
    }

    async execute(_: Browser, item: any): Promise<void> {
        await item.click();
    }
}
