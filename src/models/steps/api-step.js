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
        if (valueParts.length >= 2 && valueParts[1].length > 0) {
            propertiesValues = valueParts[1].split(',');
        }
        if (propertiesValues.length > 0) {
            propertiesValues = propertiesValues.map((value) => {
                value = value.trim();
                return replaceVariables(value, this.variables);
            });
        }

        let expectedStatus = 200;
        if (valueParts.length == 3 && valueParts[2].length > 0) {
            expectedStatus = parseInt(valueParts[2], 10);
        }

        const api = this.apis.find((a) => a.id === apiId);
        if (api) {
            const apiRun = api.duplicate();
            apiRun.path = replaceVariables(apiRun.path, this.variables);

            const isApiTesting = this.operator === 'validate';

            const result = await apiRun.run(propertiesValues, isApiTesting);
            if (!result.success) {
                if (isApiTesting) {
                    // in APi testing case we throw an error only if it does not match target
                    if (result.statusCode != expectedStatus) {
                        throw new TestRunnerError(
                            `API::Failed "${apiId}" with status code ${result.statusCode} (expected ${expectedStatus})`
                        );
                    }
                    if (expectedStatus >= 200 && expectedStatus < 300 && !result.schemaValidation) {
                        throw new TestRunnerError(
                            `API::Failed "${apiId}" with schema validation errors: ${result.schemaValidationErrors.join(', ')}`
                        );
                    }
                } else {
                    throw new TestRunnerError(`API::Failed "${apiId}" with error "${result.error}"`);
                }
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
