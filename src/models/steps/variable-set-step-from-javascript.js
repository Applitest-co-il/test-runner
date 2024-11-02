const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class VariableSetFromJavascriptStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const varParts = this.value.split('|||');
        if (varParts.length < 2) {
            throw new TestRunnerError(
                `SetVariableFromScript::Invalid set variable value format "${this.value}" - format should be "<var name>|||<script>"`
            );
        }

        const varName = varParts[0];
        const script = varParts[1];

        this.value = script;
        const varValue = await this.executeScript(driver);
        this.variables[varName] = varValue;
    }
}

module.exports = VariableSetFromJavascriptStep;
