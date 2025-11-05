import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class MouseHoverStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        const value = this.getValue;
        const duration = parseInt(value || '100') || 100;

        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item, x: 0, y: 0, duration: 100 });
        await action.pause(duration);
        await action.perform();
    }
}
