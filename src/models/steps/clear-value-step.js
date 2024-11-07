const BaseStep = require('./base-step');

class ClearValueStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        await item.clearValue();
    }
}

module.exports = ClearValueStep;
