const BaseStep = require('./base-step');

class VariableRandomIntegerStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const randomParts = this.value.split('|||');
        if (randomParts.length !== 3) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Invalid random value format "${this.value}" - format should be "<var name>|||<min value>|||<max value>" `
            );
        }
        const varName = randomParts[0];
        const minValue = parseInt(randomParts[1]);
        const maxValue = parseInt(randomParts[2]);

        if (isNaN(minValue) || isNaN(maxValue)) {
            throw new TestRunnerError(`GenerateRandowInteger::Min and Max values in "${this.value}" should be numbers`);
        }
        if (minValue >= maxValue) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Min value "${minValue}" should be less than Max value "${maxValue} - for reference value is "${this.value}`
            );
        }

        const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        this.variables[varName] = randomValue;
    }
}

module.exports = VariableRandomIntegerStep;
