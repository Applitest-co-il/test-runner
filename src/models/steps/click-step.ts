import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setHideKeyboard = true;
        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        await item.click();
    }
}
