import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ClickMultipleStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setHideKeyboard = true;
        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        const action = await driver.action('pointer', { pointerType: 'mouse' });

        await action.move({ origin: item }).pause(1);

        const count = parseInt(this.getValue || '1', 10);
        for (let i = 0; i < count; i++) {
            await action.down().pause(1).up().pause(1);
        }

        await action.perform();
    }
}
