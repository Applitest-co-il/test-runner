const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class SetValueStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver, item) {
        const actualValue = replaceVariables(this.value, this.variables);
        try {
            await item.setValue(actualValue);
        } catch (error) {
            if (error.name === 'invalid element state') {
                const keys = actualValue.split('');
                await driver.keys(keys);
            } else {
                throw error;
            }
        }
    }
}

module.exports = SetValueStep;
