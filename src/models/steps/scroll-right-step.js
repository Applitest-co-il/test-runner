const BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');

class ScrollRightStep extends BaseHorizontalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await this.horizontalScroll(driver, null, false);
    }
}

module.exports = ScrollRightStep;
