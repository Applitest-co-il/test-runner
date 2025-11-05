import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AssertCssStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('AssertCssProperty::No value provided');
        }

        const propertyParts = value.split('|||');
        if (propertyParts.length !== 2) {
            throw new TestRunnerError(
                `AssertCssProperty::Invalid value format "${value}" - format should be "<property name>|||<expected value>" `
            );
        }
        const property = propertyParts[0];
        const expectedValue = propertyParts[1].replace(/\s+/g, '').toLowerCase();
        if (!property || !expectedValue) {
            throw new TestRunnerError(
                `AssertCssProperty::Property and expected value must be defined "${value}" > "${property}" > "${expectedValue}"`
            );
        }

        // Fetch the actual value of the CSS property
        const actualValue = await item.getCSSProperty(property);
        const actualFormattedValue = actualValue.value.replace(/\s+/g, '').toLowerCase();

        // Compare the expected and actual values
        let result = false;
        const operator = this.getOperator ? this.getOperator : '==';
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
