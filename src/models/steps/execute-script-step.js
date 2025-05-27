const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class ExecuteScriptStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const script = replaceVariables(this.value, this.variables);
        return await this.executeScript(script, driver);
    }
}

module.exports = ExecuteScriptStep;
