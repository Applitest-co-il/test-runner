import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class PauseStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        await driver.pause(parseInt(this.value || '0', 10));
    }
}
