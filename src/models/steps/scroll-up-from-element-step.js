const BaseVerticalScrollStep = require('./base-vertical-scroll-step');

class ScrollUpFromElementStep extends BaseVerticalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        await this.verticalScroll(driver, item, false);
    }
}

module.exports = ScrollUpFromElementStep;
