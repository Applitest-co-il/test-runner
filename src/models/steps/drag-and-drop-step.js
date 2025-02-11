const { TestRunnerError } = require('../../helpers/test-errors');
const BaseStep = require('./base-step');

class DragAndDropStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        const dropZone = await driver.$(this.value);
        if (!dropZone) {
            throw new TestRunnerError(`Drop zone not found: ${this.value}`);
        }

        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: item }).pause(10);
        await action.down().pause(1);
        await action.move({ origin: dropZone }).pause(1);
        await action.up().pause(1);
        await action.perform();
    }
}

module.exports = DragAndDropStep;
