import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ClickMultipleStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.hideKeyboard = true;
        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: any): Promise<void> {
        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });

        await action.move({ origin: item }).pause(1);

        const count = parseInt(this.value || '1', 10);
        for (let i = 0; i < count; i++) {
            await action.down().pause(1).up().pause(1);
        }

        await action.perform();
    }
}
