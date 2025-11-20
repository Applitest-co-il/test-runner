import { TestRunnerError } from '../../helpers/test-errors';
import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class DragAndDropStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: any): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('DragAndDrop::No drop zone selector provided');
        }

        const dropZone = await driver.$(value);
        if (!dropZone) {
            throw new TestRunnerError(`Drop zone not found: ${value}`);
        }

        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: item }).pause(10);
        await action.down().pause(1);
        await action.move({ origin: dropZone }).pause(1);
        await action.up().pause(1);
        await action.perform();
    }
}
