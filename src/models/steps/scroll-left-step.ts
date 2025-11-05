import BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ScrollLeftStep extends BaseHorizontalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        await this.horizontalScroll(driver, null, true);
    }
}
