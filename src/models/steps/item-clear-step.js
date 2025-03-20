const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class ItemClearStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, __) {
        const elementName = replaceVariables(this.value, this.variables);

        if (this.savedElements && this.savedElements[elementName]) {
            delete this.savedElements[elementName];
        }
    }
}

module.exports = ItemClearStep;
