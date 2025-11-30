import { TestRunnerError } from '../../helpers/test-errors';
import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class DragAndDropStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('DragAndDrop::No element provided for drag-and-drop action');
        }

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
