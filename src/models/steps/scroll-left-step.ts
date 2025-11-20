import BaseHorizontalScrollStep from './base-horizontal-scroll-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ScrollLeftStep extends BaseHorizontalScrollStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: any): Promise<void> {
        await this.horizontalScroll(driver, null, true);
    }
}
