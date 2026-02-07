import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class BackStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const stepsBack = this.value ? parseInt(this.value, 10) : 1;
        for (let i = 0; i < stepsBack; i++) {
            await driver.back();
        }
    }
}
