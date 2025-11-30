import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

class VariableSetFromJavascriptStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('SetVariableFromScript::No value provided');
        }

        const varParts = value.split('|||');
        if (varParts.length < 2) {
            throw new TestRunnerError(
                `SetVariableFromScript::Invalid set variable value format "${value}" - format should be "<var name>|||<script>"`
            );
        }

        const varName = varParts[0];
        const script = replaceVariables(varParts[1], this.variables || {});

        const varValue = await this.executeScript(script, driver);
        const variables = this.variables;
        if (variables) {
            variables[varName] = varValue;
        }
    }
}

export = VariableSetFromJavascriptStep;
