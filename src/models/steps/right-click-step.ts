import BaseStep from './base-step';
import { TestRunnerError, TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class RightClickStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('RightClickStep: No element provided for right click action');
        }

        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: item }).pause(1);
        await action.down('right').pause(1).up('right').pause(1);
        await action.perform();
    }
}
