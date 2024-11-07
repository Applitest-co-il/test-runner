const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class AddValueStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        const actualValue = replaceVariables(this.value, this.variables);
        await item.addValue(actualValue);
    }
}

module.exports = AddValueStep;
