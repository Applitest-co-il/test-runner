import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class AssertAttributeStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: ExtendedBrowser, item: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('AssertAttribute::No value provided');
        }

        const attributeParts = value.split('|||');
        if (attributeParts.length !== 2) {
            throw new TestRunnerError(
                `AssertAttribute::Invalid value format "${value}" - format should be "<attribute name>|||<expected value>" `
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
                `Assertion failed: Attribute '${attribute}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    }
}
