const BaseStep = require('./base-step');

class HideKeyboardStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.hideKeyboard = true;
    }

    async execute(driver, _) {
        await this.doHideKeyboard(driver);
    }
}

module.exports = HideKeyboardStep;
