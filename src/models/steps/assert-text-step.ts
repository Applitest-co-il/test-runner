import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AssertTextStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const text = await item.getText();
        const actualValue = replaceVariables(this.getValue || '', this.getVariables || {});
        const operator = this.getOperator ? this.getOperator : '==';
        let result = false;
        switch (operator) {
            case '==':
                result = text === actualValue;
                break;
            case '!=':
                result = text != actualValue;
                break;
            case 'starts-with':
                result = text.startsWith(actualValue);
                break;
            case 'contains':
                result = text.indexOf(actualValue) >= 0;
                break;
            case 'not-contains':
                result = text.indexOf(actualValue) == -1;
                break;
            case 'ends-with':
                result = text.endsWith(actualValue);
                break;
        }
        if (!result) {
            throw new TestRunnerError(
                `AssertText::Text "${text}" does not match expected value "${actualValue}" using operator "${operator}" on element with ${this.getNamedElementOrUsedSelectorsComment}`
            );
        }
    }
}
