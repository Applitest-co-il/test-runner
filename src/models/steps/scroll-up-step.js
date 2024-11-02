const BaseVerticalScrollStep = require('./base-vertical-scroll-step');

class ScrollUpStep extends BaseVerticalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await this.verticalScroll(driver, null, false);
    }
}

module.exports = ScrollUpStep;
