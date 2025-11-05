import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AssertNumberStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const text = await item.getText();
        const number = +text;
        if (isNaN(number)) {
            throw new TestRunnerError(
                `AssertNumber::Text "${text}" is not a valid number on element with ${this.getNamedElementOrUsedSelectorsComment}`
            );
        }

        const value = this.getValue || '';
        const actualValue = replaceVariables(value, this.getVariables || {});
        const actualNumber = +actualValue;
        if (isNaN(actualNumber)) {
            throw new TestRunnerError(`AssertNumber::Provided value "${value}" is not a valid number`);
        }

        let result = false;
        const operator = this.getOperator ? this.getOperator : '==';
        switch (operator) {
            case '==':
                result = number == actualNumber;
                break;
            case '!=':
                result = number != actualNumber;
                break;
            case '>':
                result = number > actualNumber;
                break;
            case '>=':
                result = number >= actualNumber;
                break;
            case '<':
                result = number < actualNumber;
                break;
            case '<=':
                result = number <= actualNumber;
                break;
        }

        if (!result) {
            throw new TestRunnerError(
                `AssertNumber::Text "${text}" does not match expected value "${actualValue}" using operator "${operator}" on element with ${this.getNamedElementOrUsedSelectorsComment}`
            );
        }
    }
}
