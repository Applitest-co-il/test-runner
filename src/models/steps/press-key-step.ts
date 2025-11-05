import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class PressKeyStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const value = this.getValue;
        let key = parseInt(value || '0');
        await driver.pressKeyCode(key);
    }
}
