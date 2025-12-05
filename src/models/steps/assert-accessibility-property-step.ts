import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';
import { Accessibility } from '../accessibility';
import { replaceVariables } from '../../helpers/utils';

export default class AssertAccessibilityPropertyStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('AssertAccessibilityProperty::No value provided');
        }

        const propertyParts = value.split('|||');
        if (propertyParts.length !== 2) {
            throw new TestRunnerError(
                `AssertAccessibilityProperty::Invalid value format "${value}" - format should be "<property name>|||<expected value>"`
            );
        }

        const propertyName = replaceVariables(propertyParts[0], this.variables || {});
        const expectedValue = replaceVariables(propertyParts[1], this.variables || {});

        if (!propertyName || expectedValue === undefined) {
            throw new TestRunnerError(
                `Property name and expected value must be provided for 'assert-accessibility-property'`
            );
        }

        // Get the selector to use for accessibility tree lookup
        let selector = '';
        if (item) {
            selector = (await item.selector).toString();
        } else if (this.selectors && this.selectors.length > 0) {
            selector = this.selectors[0];
        }

        if (!selector) {
            throw new TestRunnerError(
                'AssertAccessibilityProperty::No selector available for accessibility property lookup'
            );
        }

        const accessibility = new Accessibility(driver);

        try {
            const operator = this.operator || 'direct';
            const isRecursive = operator === 'recursive';

            // Get the accessibility property value with recursive option
            const values = await accessibility.getAxPropertyValues(selector, propertyName, isRecursive);

            // Perform exact equality comparison
            if (!values.includes(expectedValue)) {
                throw new TestRunnerError(
                    `AssertAccessibilityProperty::Property "${propertyName}" possible values "[${values.join(', ')}]" does not include expected value "${expectedValue}" on element with selector "${selector}" using ${isRecursive ? 'recursive' : 'direct'} search`
                );
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            }
            throw new TestRunnerError(
                `AssertAccessibilityProperty::Error retrieving accessibility property "${propertyName}": ${(error as Error).message}`
            );
        }
    }
}
