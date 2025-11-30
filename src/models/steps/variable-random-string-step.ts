import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import randomstring, { GenerateOptions } from 'randomstring';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class VariableRandomStringStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, __: ChainablePromiseElement | null): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('GenerateRandomString::No value provided');
        }

        const randomParts = value.split('|||');
        if (randomParts.length !== 4) {
            throw new TestRunnerError(
                `GenerateRandomString::Invalid random value format "${value}" - format should be "<var name>|||<prefix>|||<max length>|||<capitalization" `
            );
        }

        if (isNaN(Number(randomParts[2]))) {
            throw new TestRunnerError(
                `GenerateRandowString::max words "${randomParts[2]}" in "${value}" should be a number`
            );
        }

        const varName = randomParts[0];
        const variables = this.variables || {};
        const prefix = randomParts[1] != 'none' ? replaceVariables(randomParts[1], variables) : '';
        const maxLen = Number(randomParts[2]) > 0 ? parseInt(randomParts[2]) : 10;
        const capitalization = randomParts[3] ? randomParts[3].toLowerCase() : 'any';

        const operator = this.operator ? this.operator : 'alphanumeric';
        const generateOptions: GenerateOptions = {
            charset: operator,
            length: maxLen
        };
        if (capitalization !== 'any') {
            generateOptions.capitalization = capitalization as 'lowercase' | 'uppercase';
        }

        const randomValue = randomstring.generate(generateOptions);
        if (prefix) {
            variables[varName] = `${prefix}-${randomValue}`;
        } else {
            variables[varName] = randomValue;
        }
    }
}
