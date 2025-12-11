import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class RefreshStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        await driver.refresh();
    }
}
