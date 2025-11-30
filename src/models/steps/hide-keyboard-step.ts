import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class HideKeyboardStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.hideKeyboard = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        await this.doHideKeyboard(driver);
    }
}
