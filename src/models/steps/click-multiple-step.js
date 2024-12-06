const BaseStep = require('./base-step');

class ClickMultipleStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        // for (let i = 0; i < this.value; i++) {
        //     await item.click();
        // }

        const action = await driver.action('pointer', { pointerType: 'mouse' });

        await action.move({ origin: item }).pause(1);

        for (let i = 0; i < this.value; i++) {
            await action.down().pause(1).up().pause(1);
        }

        await action.perform();
    }
}

module.exports = ClickMultipleStep;
