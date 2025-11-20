import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class ItemSelectStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, item: any): Promise<void> {
        const elementName = replaceVariables(this.value || '', this.variables || {});

        let savedElements = this.savedElements;
        if (!savedElements) {
            savedElements = {};
            this.savedElements = savedElements;
        }

        savedElements[elementName] = item;
    }
}
