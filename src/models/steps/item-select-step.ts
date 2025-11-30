import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class ItemSelectStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item) {
            throw new Error('ItemSelectStep: No element provided for execute action');
        }

        const elementName = replaceVariables(this.value || '', this.variables || {});

        let savedElements = this.savedElements;
        if (!savedElements) {
            savedElements = {};
            this.savedElements = savedElements;
        }

        savedElements[elementName] = item;
    }
}
