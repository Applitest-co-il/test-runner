const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class AssertIsDisplayedStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(_, item) {
        const isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(
                `AssertIsDisplayed::Item with ${this.namedElementOrUsedSelectorsComment} was not found or is not displayed`
            );
        }
    }
}

module.exports = AssertIsDisplayedStep;
