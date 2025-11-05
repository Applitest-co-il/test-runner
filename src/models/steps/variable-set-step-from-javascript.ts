import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { TestStep, ExtendedBrowser } from '../../types';

class VariableSetFromJavascriptStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _?: any): Promise<void> {
        const value = this.getValue;
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
        const script = replaceVariables(varParts[1], this.getVariables || {});

        const varValue = await this.executeScript(script, driver);
        const variables = this.getVariables;
        if (variables) {
            variables[varName] = varValue;
        }
    }
}

export = VariableSetFromJavascriptStep;
