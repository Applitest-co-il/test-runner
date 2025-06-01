const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');

class ApiStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const valueParts = this.value.split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `API::Invalid value "${this.value}" - format should be "<apiId>[|||<prop1>,<prop2>...]"`
            );
        }

        const apiId = valueParts[0];
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

        const api = this.apis.find((a) => a.id === apiId);
        if (api) {
            api.path = replaceVariables(api.path, this.variables);

            const result = await api.run(propertiesValues);
            if (!result.success) {
                throw new TestRunnerError(
                    `API::Failed "${apiId}" at step "${result.failedStep}" with error "${result.error}"`
                );
            }
            if (result.outputs) {
                this.variables = { ...this.variables, ...result.outputs };
            }
        } else {
            throw new TestRunnerError(`API::Not found "${apiId}"`);
        }
    }
}

module.exports = ApiStep;
