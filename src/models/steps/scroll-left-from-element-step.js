const BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');

class ScrollLeftFromElementStep extends BaseHorizontalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        await this.horizontalScroll(driver, item, true);
    }
}

module.exports = ScrollLeftFromElementStep;
