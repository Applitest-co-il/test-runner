const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class BaseHorizontalScrollStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        throw new TestRunnerError(`Execute method is not implemented - ${driver} - ${item}`);
    }

    async horizontalScroll(driver, originItem, left = true) {
        const count = this.value ? parseInt(this.value) : 1;

        const startPercentage = originItem ? 0 : left ? 0.1 : 0.9;
        const endPercentage = originItem ? 0.3 : left ? 0.9 : 0.1;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorY = originItem ? 0 : height * anchorPercentage;
        const startX = originItem ? 0 : width * startPercentage;
        const endX = width * endPercentage;
        const fixedScroll = left ? -endX : endX;
        const scrollX = originItem ? fixedScroll : endX - startX;
        const pointerType = this.conf.runType == 'mobile' ? 'touch' : 'mouse';

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            await driver
                .action('pointer', {
                    parameters: { pointerType: pointerType }
                })
                .move({ origin: origin, x: startX, y: anchorY })
                .down()
                .pause(10)
                .move({ origin: 'pointer', duration: scrollDuration, x: scrollX, y: 0 })
                .pause(10)
                .up()
                .pause(10)
                .perform();
            await this.addFrameToVideo();
        }
        return;
    }
}

module.exports = BaseHorizontalScrollStep;
