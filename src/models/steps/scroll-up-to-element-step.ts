import BaseScrollUpDownToElementStep = require('./base-scroll-up-down-to-element-step');
import { TestStep, ExtendedBrowser } from '../../types';

class ScrollUpToElementStep extends BaseScrollUpDownToElementStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _?: any): Promise<void> {
        await this.scrollUpOrDownToElement(driver, false);
    }
}

export = ScrollUpToElementStep;
