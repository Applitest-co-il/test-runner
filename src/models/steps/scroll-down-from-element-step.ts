import BaseVerticalScrollStep = require('./base-vertical-scroll-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ScrollDownFromElementStep extends BaseVerticalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, item: any): Promise<void> {
        await this.verticalScroll(driver, item);
    }
}
