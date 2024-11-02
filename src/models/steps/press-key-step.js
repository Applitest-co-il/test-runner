const BaseStep = require('./base-step');

class PressKeyStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        let key = parseInt(this.value);
        await driver.pressKeyCode(key);
    }
}

module.exports = PressKeyStep;
