const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class SwitchFrameStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver) {
        if (this.selectors.length === 1 && this.selectors[0] === 'top') {
            await driver.switchFrame(null);
            return;
        }

        const item = await this.selectItem(driver);
        if (!item) {
            throw new TestRunnerError(
                `SwitchFrame::Could not find indicated frame with selectors [${this.usedSelectors}]`
            );
        }
        await driver.switchFrame(item);
    }
}

module.exports = SwitchFrameStep;
