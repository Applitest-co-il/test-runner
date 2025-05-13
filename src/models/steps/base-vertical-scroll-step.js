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
        let topPercentage = 0.2;
        let bottomPercentage = 0.85;
        let count = 1;

        if (this.value && this.value.indexOf('|||') !== -1) {
            const valueParts = this.value.split('|||');
            if (valueParts.length != 3) {
                throw new TestRunnerError(
                    `VerticalScroll::Invalid scroll value format "${this.value}" - format should be "<var name>|||<var value>|||<max count>"`
                );
            }

            topPercentage = parseFloat(valueParts[1]);
            bottomPercentage = parseFloat(valueParts[2]);
            if (isNaN(topPercentage) || isNaN(bottomPercentage)) {
                throw new TestRunnerError(
                    `VerticalScroll::Invalid scroll value "${this.value}" - format should be "<var name>|||<var value>|||<max count>"`
                );
            }
            if (topPercentage < 0 || topPercentage > 1) {
                topPercentage = 0.35;
            }
            if (bottomPercentage < 0 || bottomPercentage > 1) {
                bottomPercentage = 0.85;
            }

            count = parseInt(valueParts[0]);
            if (isNaN(count) || count < 1) {
                count = 1;
            }
        } else if (this.value && this.value.length > 0) {
            count = parseInt(this.value);
            if (isNaN(count) || count < 1) {
                count = 1;
            }
        }

        const startPercentage = originItem ? 0 : down ? bottomPercentage : topPercentage;
        const endPercentage = originItem ? 0.3 : down ? topPercentage : bottomPercentage;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorX = originItem ? 0 : Math.floor(width * anchorPercentage);
        const startY = originItem ? 0 : Math.floor(height * startPercentage);
        const endY = Math.floor(height * endPercentage);
        const fixedScroll = down ? -endY : endY;
        const scrollY = originItem ? fixedScroll : endY - startY;

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            if (this.session.type == 'web') {
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
            await this.addFrameToVideo(true);
            console.log(`VerticalScroll::Scrolled: ${down ? 'down' : 'up'} - iteration: ${i} - Y: ${scrollY}px`);
        }
        return;
    }
}

module.exports = BaseVerticalScrollStep;
