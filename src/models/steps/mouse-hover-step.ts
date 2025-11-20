import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class MouseHoverStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: any): Promise<void> {
        const value = this.value;
        const duration = parseInt(value || '100') || 100;

        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: item, x: 0, y: 0, duration: 100 });
        await action.pause(duration);
        await action.perform();
    }
}
