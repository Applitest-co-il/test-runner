const BaseStep = require('./base-step');

class MouseHoverStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver, item) {
        const duration = parseInt(this.value) || 100;

        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item, x: 0, y: 0, duration: 100 });
        await action.pause(duration);
        await action.perform();
    }
}

module.exports = MouseHoverStep;
