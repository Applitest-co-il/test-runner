import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class AppBackgroundStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: any): Promise<void> {
        await driver.execute('mobile: backgroundApp');
    }
}
