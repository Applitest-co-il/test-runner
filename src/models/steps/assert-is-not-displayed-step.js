const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class AssertIsNotDisplayedStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver) {
        const item = await this.selectItem(driver);
        if (!item) {
            return;
        }
        let isDisplayed = await item.isDisplayed();
        if (isDisplayed) {
            await this.highlightElement(driver, item);
            await this.addFrameToVideo();
            await this.revertElementHighlight(driver, item);
            throw new TestRunnerError(`AssertIsNotDisplayed::Item with selectors [${this.usedSelectors}] is displayed`);
        }
    }
}

module.exports = AssertIsNotDisplayedStep;
