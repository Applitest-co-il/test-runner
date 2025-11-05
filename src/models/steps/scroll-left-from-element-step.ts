import BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');
import { TestStep, ExtendedBrowser } from '../../types';

class ScrollLeftFromElementStep extends BaseHorizontalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        await this.horizontalScroll(driver, item, true);
    }
}

export = ScrollLeftFromElementStep;
