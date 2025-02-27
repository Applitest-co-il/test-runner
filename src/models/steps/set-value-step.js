const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class SetValueStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_, item) {
        const actualValue = replaceVariables(this.value, this.variables);
        await item.setValue(actualValue);
    }
}

module.exports = SetValueStep;
