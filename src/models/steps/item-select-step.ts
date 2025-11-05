import BaseStep = require('./base-step');
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class ItemSelectStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const elementName = replaceVariables(this.getValue || '', this.getVariables || {});

        let savedElements = this.getSavedElements;
        if (!savedElements) {
            savedElements = {};
            this.setSavedElements = savedElements;
        }

        savedElements[elementName] = item;
    }
}
