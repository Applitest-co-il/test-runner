const BaseScrollUpDownToElementStep = require('./base-scroll-up-down-to-element-step');

class ScrollUpToElementStep extends BaseScrollUpDownToElementStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await this.scrollUpOrDownToElement(driver, false);
    }
}

module.exports = ScrollUpToElementStep;
