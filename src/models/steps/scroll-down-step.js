const BaseVerticalScrollStep = require('./base-vertical-scroll-step');

class ScrollDownStep extends BaseVerticalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await this.verticalScroll(driver, null, true);
    }
}

module.exports = ScrollDownStep;
