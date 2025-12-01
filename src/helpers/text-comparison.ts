import { TestRunnerError } from './test-errors';

/**
 * Shared helper function for text comparison operations
 * Used by assert-text, assert-current-url, and assert-current-title steps
 */
export function compareTextValues(
    actualValue: string,
    expectedValue: string,
    operator: string,
    stepName: string,
    contextInfo: string = ''
): void {
    let result = false;

    switch (operator) {
        case '==':
            result = actualValue === expectedValue;
            break;
        case '!=':
            result = actualValue !== expectedValue;
            break;
        case 'starts-with':
            result = actualValue.startsWith(expectedValue);
            break;
        case 'contains':
            result = actualValue.indexOf(expectedValue) >= 0;
            break;
        case 'not-contains':
            result = actualValue.indexOf(expectedValue) === -1;
            break;
        case 'ends-with':
            result = actualValue.endsWith(expectedValue);
            break;
        default:
            throw new TestRunnerError(`${stepName}::Unsupported operator "${operator}"`);
    }

    if (!result) {
        const context = contextInfo ? ` ${contextInfo}` : '';
        throw new TestRunnerError(
            `${stepName}::Value "${actualValue}" does not match expected value "${expectedValue}" using operator "${operator}"${context}`
        );
    }
}
