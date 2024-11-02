const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');
const { TestRunnerError } = require('../../helpers/test-errors');

class ToggleAirplaneModeStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const value = replaceVariables(this.value, this.variables);

        try {
            if (value === 'on') {
                await driver.setNetworkConnection(1);
            } else {
                await driver.setNetworkConnection(6);
            }
        } catch (error) {
            throw new TestRunnerError(
                `ToggleAirplaneMode::Failed to toggle airplane mode to "${value}". Error: ${error.message}`
            );
        }
    }
}

module.exports = ToggleAirplaneModeStep;
