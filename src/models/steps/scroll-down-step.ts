import BaseVerticalScrollStep from './base-vertical-scroll-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class ScrollDownStep extends BaseVerticalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        await this.verticalScroll(driver, null, true);
    }
}
