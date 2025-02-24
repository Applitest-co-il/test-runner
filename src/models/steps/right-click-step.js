const BaseStep = require('./base-step');

class RightClickStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver, item) {
        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item }).pause(1);
        await action.down('right').pause(1).up('right').pause(1);
        await action.perform();
    }
}

module.exports = RightClickStep;
