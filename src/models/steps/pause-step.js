const BaseStep = require('./base-step');

class PauseStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await driver.pause(this.value);
    }
}

module.exports = PauseStep;
