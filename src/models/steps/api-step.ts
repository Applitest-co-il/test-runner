import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

export default class ApiStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: ExtendedBrowser, __: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('API::No value provided');
        }

        const valueParts = value.split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `API::Invalid value "${value}" - format should be "<apiId>[|||<prop1>,<prop2>...]"`
            );
        }

        const apiId = valueParts[0];

        let propertiesValues: string[] = [];
        if (valueParts.length >= 2 && valueParts[1].length > 0) {
            propertiesValues = valueParts[1].split(',');
        }
        if (propertiesValues.length > 0) {
            const variables = this.getVariables || {};
            propertiesValues = propertiesValues.map((value) => {
                value = value.trim();
                return replaceVariables(value, variables);
            });
        }

        let outputVariablesNameOverride: string[] = [];
        if (valueParts.length == 3 && valueParts[2].length > 0) {
            outputVariablesNameOverride = valueParts[2].split(',');
        }

        let expectedStatus = 200;
        let expectedOutputs: string[] = [];
        if (valueParts.length == 4 && valueParts[3].length > 0) {
            if (valueParts[2].length > 0) {
                expectedStatus = parseInt(valueParts[2], 10);
            }
            const variables = this.getVariables || {};
            expectedOutputs = valueParts[3].split(',').map((output) => {
                return replaceVariables(output.trim(), variables);
            });
        }

        const apis = this.getApis || {};
        const apiList = Array.isArray(apis) ? apis : Object.values(apis);
        const api = apiList.find((a: any) => a.id === apiId);
        if (api) {
            console.log(`API "${apiId}" executed with properties: ${propertiesValues.join(', ')}`);

            const apiRun = api.duplicate();
            const variables = this.getVariables || {};
            apiRun.path = replaceVariables(apiRun.path, variables);

            const isApiTesting = this.getOperator === 'validate';

            const result = await apiRun.run(propertiesValues, isApiTesting);

            console.log(`API "${apiId}" executed with result: ${JSON.stringify(result)}`);

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
                const variablesObj = this.getVariables || {};
                for (let pos = 0; pos < outputsKeys.length; pos++) {
                    const key = outputsKeys[pos];
                    if (outputVariablesNameOverride.length > pos) {
                        variablesObj[outputVariablesNameOverride[pos]] = result.outputs[key];
                    } else {
                        variablesObj[key] = result.outputs[key];
                    }
                }
            }
        } else {
            throw new TestRunnerError(`API::Not found "${apiId}"`);
        }
    }
}
