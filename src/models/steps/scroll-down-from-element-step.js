const BaseVerticalScrollStep = require('./base-vertical-scroll-step');

class ScrollDownFromElementStep extends BaseVerticalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        await this.verticalScroll(driver, item);
    }
}

module.exports = ScrollDownFromElementStep;
