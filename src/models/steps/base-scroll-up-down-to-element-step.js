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
                const isDisplayed = await item.isDisplayed();
                if (isDisplayed) {
                    if (this.session.type === 'web') {
                        const isClickable = await item.isClickable();
                        if (isClickable) {
                            break;
                        }
                    } else {
                        break; // for mobile is displayed is enough
                    }
                }
            }
            count++;
        }
        if (!item) {
            throw new TestRunnerError(
                `ScrollToElement::Item with ${this.namedElementOrUsedSelectorsComment} was not found after scrolling ${maxCount} times`
            );
        }
    }
}

module.exports = BaseScrollUpDownToElementStep;
