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

        const valueParts = this.value.split('|||');
        if (valueParts.length != 3) {
            throw new TestRunnerError(
                `ScrollToElement::Invalid scroll value format "${this.value}" - format should be "<var name>|||<var value>|||<max count>"`
            );
        }

        let maxCount = parseInt(valueParts[0]);
        if (isNaN(maxCount) || maxCount < 1) {
            maxCount = 1;
        }
        this.value = `1|||${valueParts[1]}|||${valueParts[2]}`;

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
