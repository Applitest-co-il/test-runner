const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');
const { TestRunnerError } = require('../../helpers/test-errors');
const randomstring = require('randomstring');

class VariableRandomStringStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const randomParts = this.value.split('|||');
        if (randomParts.length !== 3) {
            throw new TestRunnerError(
                `GenerateRandomString::Invalid random value format "${this.value}" - format should be "<var name>|||<prefix>|||<max length>" `
            );
        }
        const varName = randomParts[0];
        const prefix = randomParts[1] != 'none' ? replaceVariables(randomParts[1], this.variables) : '';
        const maxLen = randomParts[2] > 0 ? parseInt(randomParts[2]) : 10;

        if (isNaN(maxLen)) {
            throw new TestRunnerError(`GenerateRandowString::max words in "${this.value}" should be a number`);
        }

        const operator = this.operator ? this.operator : 'alphanumeric';
        const generateOptions = {
            charset: operator,
            length: maxLen
        };
        const randomValue = await randomstring.generate(generateOptions);
        if (prefix) {
            this.variables[varName] = `${prefix}-${randomValue}`;
        } else {
            this.variables[varName] = randomValue;
        }
    }
}

module.exports = VariableRandomStringStep;
