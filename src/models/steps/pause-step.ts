import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class PauseStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        await driver.pause(parseInt(this.getValue || '0', 10));
    }
}
