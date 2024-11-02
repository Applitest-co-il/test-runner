const BaseStep = require('./base-step');

class ClickMultipleStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(_, item) {
        for (let i = 0; i < this.value; i++) {
            await item.click();
        }
    }
}

module.exports = ClickMultipleStep;
