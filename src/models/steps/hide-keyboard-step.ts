import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class HideKeyboardStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setHideKeyboard = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        await this.doHideKeyboard(driver);
    }
}
