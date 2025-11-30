import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { logger } from '../../helpers/log-service';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class FunctionStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(_: Browser, __: ChainablePromiseElement | null): Promise<void> {
        if (!this.session) {
            throw new TestRunnerError('Function::No session available to execute function');
        }

        const valueParts = (this.value || '').split('|||');
        if (valueParts.length < 1) {
            throw new TestRunnerError(
                `Function::Invalid value "${this.value}" - format should be "<functionId>[|||<prop1>,<prop2>...]"`
            );
        }

        const functionId = valueParts[0];
        let propertiesValues: string[] = [];
        if (valueParts.length === 2 && valueParts[1].length > 0) {
            propertiesValues = valueParts[1].split(',');
        }
        if (propertiesValues.length > 0) {
            propertiesValues = propertiesValues.map((value) => {
                value = value.trim();
                return replaceVariables(value, this.variables || {});
            });
        }

        const functions = this.functions;
        if (!functions) {
            throw new TestRunnerError('Functions are not available in this context');
        }

        const func = functions.find((f) => f.getId === functionId);
        if (func) {
            logger.info(`Function "${functionId}" executed with properties: ${propertiesValues.join(', ')}`);

            const duplicatedFunc = func.duplicate();

            const variables = this.variables || {};
            if (variables && variables.apiBaseUrl) {
                duplicatedFunc.getProperties.push('apiBaseUrl');
                propertiesValues.push(variables.apiBaseUrl);
            }

            const result = await duplicatedFunc.run(
                this.session,
                propertiesValues,
                functions,
                this.apis ?? [],
                this.videoRecorder,
                `${this.videoBaseStep}${this.sequence}`
            );

            logger.info(`Function "${functionId}" executed with result: ${JSON.stringify(result)}`);

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
