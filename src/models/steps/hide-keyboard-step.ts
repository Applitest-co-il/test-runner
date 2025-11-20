import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class HideKeyboardStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.hideKeyboard = true;
    }

    async execute(driver: Browser, _: any): Promise<void> {
        await this.doHideKeyboard(driver);
    }
}
