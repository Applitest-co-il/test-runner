import { TestRunnerError } from '../../helpers/test-errors';
import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class DragAndDropStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('DragAndDrop::No drop zone selector provided');
        }

        const dropZone = await driver.$(value);
        if (!dropZone) {
            throw new TestRunnerError(`Drop zone not found: ${value}`);
        }

        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item }).pause(10);
        await action.down().pause(1);
        await action.move({ origin: dropZone }).pause(1);
        await action.up().pause(1);
        await action.perform();
    }
}
