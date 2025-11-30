import BaseStep from './base-step';
import { TestRunnerError, TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class MouseHoverStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new TestRunnerError('MouseHoverStep: No element provided for mouse hover action');
        }

        const value = this.value;
        const duration = parseInt(value || '100') || 100;

        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: item, x: 0, y: 0, duration: 100 });
        await action.pause(duration);
        await action.perform();
    }
}
