const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class AssertNumberStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_, item) {
        const text = await item.getText();
        const number = +text;
        if (isNaN(number)) {
            throw new TestRunnerError(
                `AssertNumber::Text "${text}" is not a valid number on element with ${this.namedElementOrUsedSelectorsComment}`
            );
        }

        const actualValue = replaceVariables(this.value, this.variables);
        const actualNumber = +actualValue;
        if (isNaN(actualNumber)) {
            throw new TestRunnerError(`AssertNumber::Provided value "${this.value}" is not a valid number`);
        }

        let result = false;
        const operator = this.operator ? this.operator : '==';
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
                `AssertNumber::Text "${text}" does not match expected value "${actualValue}" using operator "${operator}" on element with ${this.namedElementOrUsedSelectorsComment}`
            );
        }
    }
}

module.exports = AssertNumberStep;
