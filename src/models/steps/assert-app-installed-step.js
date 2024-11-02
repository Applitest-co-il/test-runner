const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables } = require('../../helpers/utils');
const { checkAppIsInstalled } = require('../../helpers/mobile-utils');

class AssertAppInstalledStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const app = replaceVariables(this.value, this.variables);
        try {
            const isInstalled = await checkAppIsInstalled(driver, app);
            if (!isInstalled) {
                throw new TestRunnerError(`AssertAppInstalled::App "${app}" is not installed`);
            }
        } catch (error) {
            throw new TestRunnerError(
                `AssertAppInstalled::Failed to check if app "${app}" is installed. Error: ${error.message}`
            );
        }
    }
}

module.exports = AssertAppInstalledStep;
