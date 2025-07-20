const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class AssertCssStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_, item) {
        const propertyParts = this.value.split('|||');
        if (propertyParts.length !== 2) {
            throw new TestRunnerError(
                `AssertCssProperty::Invalid value format "${this.value}" - format should be "<property name>|||<expected value>" `
            );
        }
        const property = propertyParts[0];
        const expectedValue = propertyParts[1].replace(/\s+/g, '').toLowerCase();
        if (!property || !expectedValue) {
            throw new TestRunnerError(
                `AssertCssProperty::Property and expected value must be defined "${this.value}" > "${property}" > "${expectedValue}"`
            );
        }

        // Fetch the actual value of the CSS property
        const actualValue = await item.getCSSProperty(property);
        const actualFormattedValue = actualValue.value.replace(/\s+/g, '').toLowerCase();

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
                `Assertion failed: CSS property '${property}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    }
}

module.exports = AssertCssStep;
