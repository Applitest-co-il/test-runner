const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class AssertAttributeStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        const attributeParts = this.value.split('|||');
        if (attributeParts.length !== 2) {
            throw new TestRunnerError(
                `AssertAttribute::Invalid value format "${this.value}" - format should be "<attribute name>|||<expected value>" `
            );
        }
        const attribute = attributeParts[0];
        const expectedValue = attributeParts[1].replace(/\s+/g, '').toLowerCase();
        if (!attribute || !expectedValue) {
            throw new TestRunnerError(`Attribute and expected value must be provided for 'assert-attribute'`);
        }

        // Fetch the actual value of the attribute
        const actualValue = await item.getAttribute(attribute);
        const actualFormattedValue = actualValue.replace(/\s+/g, '').toLowerCase();

        // Compare the expected and actual values
        let result = false;
        const operator = this.operator ? this.operator : '==';
        switch (operator) {
            case '==':
                result = expectedValue == actualFormattedValue;
                break;
            case '!=':
                result = expectedValue != actualFormattedValue;
                break;
        }

        if (!result) {
            throw new TestRunnerError(
                `Assertion failed: Attribute '${attribute}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    }
}

module.exports = AssertAttributeStep;
