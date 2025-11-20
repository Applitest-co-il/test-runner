import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

class VariableRandomIntegerStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, __?: any): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('GenerateRandomInteger::No value provided');
        }

        const randomParts = value.split('|||');
        if (randomParts.length !== 3) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Invalid random value format "${value}" - format should be "<var name>|||<min value>|||<max value>" `
            );
        }
        const varName = randomParts[0];
        const minValue = parseInt(randomParts[1], 10);
        const maxValue = parseInt(randomParts[2], 10);

        if (isNaN(minValue) || isNaN(maxValue)) {
            throw new TestRunnerError(`GenerateRandowInteger::Min and Max values in "${value}" should be numbers`);
        }
        if (minValue >= maxValue) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Min value "${minValue}" should be less than Max value "${maxValue} - for reference value is "${value}`
            );
        }

        const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        const variables = this.variables;
        if (variables) {
            variables[varName] = randomValue.toString();
        }
    }
}

export = VariableRandomIntegerStep;
