const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class FunctionStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver) {
        const actualValue = replaceVariables(this.value, this.variables);
        const valueParts = actualValue.split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `Function::Invalid value "${this.value}" - format should be "<functionId>[|||<prop1>,<prop2>...]"`
            );
        }

        const functionId = valueParts[0];
        let propertiesValues = [];
        if (valueParts.length == 2) {
            propertiesValues = valueParts[1].split(',');
        }

        const func = this.functons.find((f) => f.id === functionId);
        if (func) {
            const result = await func.run(driver, propertiesValues, this.variables, this.videoRecorder);
            if (!result.success) {
                throw new TestRunnerError(
                    `Function::Failed "${functionId}" at step "${result.failedStep}" with error "${result.error}"`
                );
            }
        }
    }
}

module.exports = FunctionStep;
