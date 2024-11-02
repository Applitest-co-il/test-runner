const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class BaseVerticalScrollStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, item) {
        throw new TestRunnerError(`Execute method is not implemented - ${driver} - ${item}`);
    }

    async verticalScroll(driver, originItem, down = true) {
        const count = this.value ? parseInt(this.value) : 1;

        const startPercentage = originItem ? 0 : down ? 0.85 : 0.2;
        const endPercentage = originItem ? 0.3 : down ? 0.2 : 0.85;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorX = originItem ? 0 : width * anchorPercentage;
        const startY = originItem ? 0 : height * startPercentage;
        const endY = height * endPercentage;
        const fixedScroll = down ? -endY : endY;
        const scrollY = originItem ? fixedScroll : endY - startY;

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            if (this.conf.runType == 'web') {
                const actualScrollY = -scrollY;

                await driver
                    .action('wheel')
                    .scroll({ origin: origin, deltaX: anchorX, deltaY: actualScrollY })
                    .pause(10)
                    .perform();
            } else {
                await driver
                    .action('pointer', {
                        parameters: { pointerType: 'touch' }
                    })
                    .move({ origin: origin, x: anchorX, y: startY })
                    .down()
                    .pause(10)
                    .move({ origin: 'pointer', duration: scrollDuration, x: 0, y: scrollY })
                    .pause(10)
                    .up()
                    .pause(10)
                    .perform();
            }
            await this.addFrameToVideo();
            console.log(`VerticalScroll::Scrolled: ${down ? 'down' : 'up'} - iteration: ${i} - Y: ${scrollY}px`);
        }
        return;
    }
}

module.exports = BaseVerticalScrollStep;
