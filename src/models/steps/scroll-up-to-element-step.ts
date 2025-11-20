import BaseScrollUpDownToElementStep from './base-scroll-up-down-to-element-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

class ScrollUpToElementStep extends BaseScrollUpDownToElementStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _?: any): Promise<void> {
        await this.scrollUpOrDownToElement(driver, false);
    }
}

export = ScrollUpToElementStep;
