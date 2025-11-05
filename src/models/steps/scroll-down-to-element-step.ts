import BaseScrollUpDownToElementStep = require('./base-scroll-up-down-to-element-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ScrollDownToElementStep extends BaseScrollUpDownToElementStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _?: any): Promise<void> {
        await this.scrollUpOrDownToElement(driver, true);
    }
}
