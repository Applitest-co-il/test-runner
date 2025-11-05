import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class ClearValueStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        await item.clearValue();
    }
}
