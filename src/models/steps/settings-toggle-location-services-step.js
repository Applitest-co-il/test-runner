const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');
const { TestRunnerError } = require('../../helpers/test-errors');

class ToggleLocationServicesStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const value = replaceVariables(this.value, this.variables);
        try {
            if (driver.capabilities.platformName.toLowerCase() === 'android') {
                // Toggle location services using shell command
                const toggleCommand =
                    value === 'on' ? 'settings put secure location_mode 3' : 'settings put secure location_mode 0';
                await driver.execute('mobile: shell', { command: toggleCommand });
            }
        } catch (error) {
            throw new TestRunnerError(
                `ToggleLocationServices::Failed to toggle location services to "${value}". Error: ${error.message}`
            );
        }
    }
}

module.exports = ToggleLocationServicesStep;
