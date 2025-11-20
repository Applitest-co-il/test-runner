import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class MiddleClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: any): Promise<void> {
        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: item }).pause(1);
        await action.down('middle').pause(1).up('middle').pause(1);
        await action.perform();
    }
}
