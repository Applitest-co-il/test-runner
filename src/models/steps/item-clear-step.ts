import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class ItemClearStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: ExtendedBrowser, __?: any): Promise<void> {
        const elementName = replaceVariables(this.getValue || '', this.getVariables || {});

        const savedElements = this.getSavedElements;
        if (savedElements && savedElements[elementName]) {
            delete savedElements[elementName];
        }
    }
}
