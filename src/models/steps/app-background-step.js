const BaseStep = require('./base-step');

class AppBackgroundStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await driver.execute('mobile: backgroundApp');
    }
}

module.exports = AppBackgroundStep;
