import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class PressKeyStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const value = this.value;
        let key = parseInt(value || '0');
        await driver.pressKeyCode(key);
    }
}
