import BaseVerticalScrollStep = require('./base-vertical-scroll-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ScrollUpStep extends BaseVerticalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        await this.verticalScroll(driver, null, false);
    }
}
