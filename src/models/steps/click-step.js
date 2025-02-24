const BaseStep = require('./base-step');

class ClickStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.hideKeyboard = true;
        this.takeSnapshot = true;
    }

    async execute(_, item) {
        await item.click();
    }
}

module.exports = ClickStep;
