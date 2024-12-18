const BaseStep = require('./base-step');

class MiddleClickStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item }).pause(1);
        await action.down('middle').pause(1).up('middle').pause(1);
        await action.perform();
    }
}

module.exports = MiddleClickStep;
