import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class AppBackgroundStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        await driver.execute('mobile: backgroundApp');
    }
}
