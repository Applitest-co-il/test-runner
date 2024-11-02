const BaseHorizontalScrollStep = require('./base-horizontal-scroll-step');

class ScrollLefttStep extends BaseHorizontalScrollStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        await this.horizontalScroll(driver, null, true);
    }
}

module.exports = ScrollLefttStep;
