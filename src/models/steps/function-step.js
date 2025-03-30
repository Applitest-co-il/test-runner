const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class FunctionStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const actualValue = replaceVariables(this.value, this.variables);
        const valueParts = actualValue.split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `Function::Invalid value "${this.value}" - format should be "<functionId>[|||<prop1>,<prop2>...]"`
            );
        }

        const functionId = valueParts[0];
        let propertiesValues = [];
        if (valueParts.length == 2 && valueParts[1].length > 0) {
            propertiesValues = valueParts[1].split(',');
        }

        const func = this.functions.find((f) => f.id === functionId);
        if (func) {
            const result = await func.run(this.session, propertiesValues, this.functions, this.videoRecorder);
            if (!result.success) {
                throw new TestRunnerError(
                    `Function::Failed "${functionId}" at step "${result.failedStep}" with error "${result.error}"`
                );
            }
        } else {
            throw new TestRunnerError(`Function::Not found "${functionId}"`);
        }
    }
}

module.exports = FunctionStep;
