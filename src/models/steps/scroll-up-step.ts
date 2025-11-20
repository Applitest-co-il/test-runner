import BaseVerticalScrollStep from './base-vertical-scroll-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ScrollUpStep extends BaseVerticalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: any): Promise<void> {
        await this.verticalScroll(driver, null, false);
    }
}
