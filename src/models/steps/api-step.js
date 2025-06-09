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

        let outputVariablesNameOverride = [];
        if (valueParts.length == 3 && valueParts[2].length > 0) {
            outputVariablesNameOverride = valueParts[2].split(',');
        }

        let expectedStatus = 200;
        let expectedOutputs = [];
        if (valueParts.length == 4 && valueParts[3].length > 0) {
            if (valueParts[2].length > 0) {
                expectedStatus = parseInt(valueParts[2], 10);
            }
            expectedOutputs = valueParts[3].split(',').map((output) => {
                return replaceVariables(output.trim(), this.variables);
            });
        }

        const api = this.apis.find((a) => a.id === apiId);
        if (api) {
            const apiRun = api.duplicate();
            apiRun.path = replaceVariables(apiRun.path, this.variables);

            const isApiTesting = this.operator === 'validate';

            const result = await apiRun.run(propertiesValues, isApiTesting);
            if (!result.success) {
                if (isApiTesting) {
                    // in API testing case we throw an error only if it does not match target
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
            } else {
                if (isApiTesting) {
                    if (expectedOutputs.length > 0) {
                        if (api.outputs.length !== expectedOutputs.length) {
                            throw new TestRunnerError(
                                `API::Expected outputs for "${apiId}": expected is defined as ${expectedOutputs.length} elements (${expectedOutputs.join(', ')})  while API actual outputs are  ${api.outputs.length} elements (${api.outputs.join(', ')})`
                            );
                        }
                        const resultOutputsKeys = Object.keys(result.outputs);
                        for (let pos = 0; pos < resultOutputsKeys.length; pos++) {
                            const key = resultOutputsKeys[pos];
                            const index = api.outputs.indexOf(key);
                            if (index === -1) {
                                throw new TestRunnerError(
                                    `API::Output "${key}" for "${apiId}" is not defined in API outputs`
                                );
                            }
                            const expectedValue = expectedOutputs[index];
                            if (result.outputs[key] !== expectedValue) {
                                throw new TestRunnerError(
                                    `API::Output "${key}" for "${apiId}" does not match expected value: expected "${expectedValue}", got "${result.outputs[key]}"`
                                );
                            }
                        }
                    }
                }
            }
            if (result.outputs) {
                const outputsKeys = Object.keys(result.outputs);
                for (let pos = 0; pos < outputsKeys.length; pos++) {
                    const key = outputsKeys[pos];
                    if (outputVariablesNameOverride.length > pos) {
                        this.variables[outputVariablesNameOverride[pos]] = result.outputs[key];
                    } else {
                        this.variables[key] = result.outputs[key];
                    }
                }
            }
        } else {
            throw new TestRunnerError(`API::Not found "${apiId}"`);
        }
    }
}

module.exports = ApiStep;
