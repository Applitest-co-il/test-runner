const BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');

class ScrollRightFromElementStep extends BaseHorizontalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        await this.horizontalScroll(driver, item, false);
    }
}

module.exports = ScrollRightFromElementStep;
