const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class FunctionStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver) {
        const valueParts = this.value.split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `Function::Invalid value "${this.value}" - format should be "<functionName>|||<param1>|||<param2>|||..."`
            );
        }

        const functionId = valueParts[0];
        let propertiesValues = [];
        if (valueParts.length > 1) {
            propertiesValues = valueParts.slice(1);
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
