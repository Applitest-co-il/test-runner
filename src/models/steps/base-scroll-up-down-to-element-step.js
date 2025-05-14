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
        const scrollOptions = this.parseScrollValue();

        const startPercentage = down ? scrollOptions.bottomPercentage : scrollOptions.topPercentage;
        const endPercentage = down ? scrollOptions.topPercentage : scrollOptions.bottomPercentage;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = 'viewport';
        const anchorX = Math.floor(width * scrollOptions.anchorPercentage);
        const startY = Math.floor(height * startPercentage);
        const endY = Math.floor(height * endPercentage);
        const scrollY = endY - startY;

        let item = null;
        let count = 0;
        while (count <= scrollOptions.count) {
            item = await this.selectItem(driver);
            if (!item) {
                await this.doVerticalScroll(driver, scrollDuration, origin, startY, scrollY, anchorX);
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
