const BaseStep = require('./base-step');

class ClickStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        await item.click();
    }
}

module.exports = ClickStep;
