import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class RightClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item }).pause(1);
        await action.down('right').pause(1).up('right').pause(1);
        await action.perform();
    }
}
