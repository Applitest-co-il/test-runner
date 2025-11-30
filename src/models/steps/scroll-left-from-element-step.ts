import BaseHorizontalScrollStep from './base-horizontal-scroll-step';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

class ScrollLeftFromElementStep extends BaseHorizontalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        await this.horizontalScroll(driver, item, true);
    }
}

export = ScrollLeftFromElementStep;
