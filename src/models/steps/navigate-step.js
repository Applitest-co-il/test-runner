const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class NavigateStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const url = replaceVariables(this.value, this.variables);

        if (this.operator === 'new') {
            await driver.newWindow(url);
            return;
        } else {
            await driver.url(url);
        }
    }
}

module.exports = NavigateStep;
