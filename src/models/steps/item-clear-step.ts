import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ItemClearStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, __?: any): Promise<void> {
        const elementName = replaceVariables(this.value || '', this.variables || {});

        const savedElements = this.savedElements;
        if (savedElements && savedElements[elementName]) {
            delete savedElements[elementName];
        }
    }
}
