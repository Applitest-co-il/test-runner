const BaseStep = require('./base-step');

class ExecuteScriptStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        return await this.executeScript(driver);
    }
}

module.exports = ExecuteScriptStep;
