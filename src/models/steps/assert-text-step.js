const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class AssertTextStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        const text = await item.getText();
        const actualValue = replaceVariables(this.value, this.variables);
        const operator = this.operator ? this.operator : '==';
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
                `AssertText::Text "${text}" does not match expected value "${actualValue}" using operator "${operator} on element with selectors [${this.usedSelectors}]"`
            );
        }
    }
}

module.exports = AssertTextStep;
