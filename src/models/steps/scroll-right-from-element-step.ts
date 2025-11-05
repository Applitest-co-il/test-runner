import BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');
import { TestStep, ExtendedBrowser } from '../../types';

class ScrollRightFromElementStep extends BaseHorizontalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        await this.horizontalScroll(driver, item, false);
    }
}

export = ScrollRightFromElementStep;
