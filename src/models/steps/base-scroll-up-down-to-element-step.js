const BaseVerticalScrollStep = require('./base-vertical-scroll-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class BaseScrollUpDownToElementStep extends BaseVerticalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        throw new TestRunnerError(`Execute method is not implemented - ${driver} - ${item}`);
    }

    async scrollUpOrDownToElement(driver, down = true) {
        let count = 0;
        let maxCount = this.value ? parseInt(this.value) : 1;
        this.value = 1;

        let item = null;
        while (count <= maxCount) {
            item = await this.selectItem(driver);
            if (!item) {
                await this.verticalScroll(driver, null, down);
            } else {
                break;
            }
            count++;
        }
        if (!item) {
            throw new TestRunnerError(
                `ScrollToElement::Item with selectors [${this.usedSelector}] was not found after scrolling ${maxCount} times`
            );
        }
    }
}

module.exports = BaseScrollUpDownToElementStep;
