const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class FunctionStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const valueParts = this.value.split('|||');
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
        if (propertiesValues.length > 0) {
            propertiesValues = propertiesValues.map((value) => {
                value = value.trim();
                return replaceVariables(value, this.variables);
            });
        }

        const func = this.functions.find((f) => f.id === functionId);
        if (func) {
            const duplicatedFunc = func.duplicate();

            if (this.variables && this.variables.apiBaseUrl) {
                duplicatedFunc.properties.push('apiBaseUrl');
                propertiesValues.push(this.variables.apiBaseUrl);
            }

            const result = await duplicatedFunc.run(
                this.session,
                propertiesValues,
                this.functions,
                this.apis,
                this.videoRecorder
            );
            if (!result.success) {
                throw new TestRunnerError(
                    `Function::Failed "${functionId}" at step "${result.failedStep}" with error "${result.error}"`
                );
            }
            if (result.outputs) {
                this.variables = { ...this.variables, ...result.outputs };
            }
        } else {
            throw new TestRunnerError(`Function::Not found "${functionId}"`);
        }
    }
}

module.exports = FunctionStep;
