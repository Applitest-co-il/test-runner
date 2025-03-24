const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');

class ItemSelectStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        const elementName = replaceVariables(this.value, this.variables);

        if (!this.savedElements) {
            this.savedElements = {};
        }

        this.savedElements[elementName] = item;
    }
}

module.exports = ItemSelectStep;
