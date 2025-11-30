import BaseVerticalScrollStep from './base-vertical-scroll-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class ScrollDownFromElementStep extends BaseVerticalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        await this.verticalScroll(driver, item);
    }
}
