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
        const scrollOptions = this.parseScrollValue();

        const startPercentage = originItem ? 0 : down ? scrollOptions.bottomPercentage : scrollOptions.topPercentage;
        const endPercentage = originItem ? 0.3 : down ? scrollOptions.topPercentage : scrollOptions.bottomPercentage;
        const scrollDuration = 300;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorX = originItem ? 0 : Math.floor(width * scrollOptions.anchorPercentage);
        const startY = originItem ? 0 : Math.floor(height * startPercentage);
        const endY = Math.floor(height * endPercentage);
        const fixedScroll = down ? -endY : endY;
        const scrollY = originItem ? fixedScroll : endY - startY;
        const scrollEvt = scrollOptions.count > 1 ? scrollOptions.count : 1;

        for (let i = 0; i < scrollEvt; i++) {
            await this.doVerticalScroll(driver, scrollDuration, origin, startY, scrollY, anchorX);
        }
        return;
    }

    async doVerticalScroll(driver, scrollDuration, origin, startY, scrollY, anchorX) {
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
    }

    parseScrollValue() {
        let scrollOptions = {
            topPercentage: 0.2,
            bottomPercentage: 0.85,
            anchorPercentage: 0.5,
            count: 1
        };

        if (this.value && this.value.indexOf('|||') !== -1) {
            const valueParts = this.value.split('|||');

            if (valueParts.length >= 2) {
                scrollOptions.topPercentage = parseFloat(valueParts[1]);
                if (
                    isNaN(scrollOptions.topPercentage) ||
                    scrollOptions.topPercentage < 0 ||
                    scrollOptions.topPercentage > 1
                ) {
                    scrollOptions.topPercentage = 0.2;
                }
            }

            if (valueParts.length >= 3) {
                scrollOptions.bottomPercentage = parseFloat(valueParts[2]);
                if (scrollOptions.bottomPercentage < 0 || scrollOptions.bottomPercentage > 1) {
                    scrollOptions.bottomPercentage = 0.85;
                }
            }

            if (valueParts.length >= 4) {
                scrollOptions.anchorPercentage = parseFloat(valueParts[3]);
                if (
                    isNaN(scrollOptions.anchorPercentage) ||
                    scrollOptions.anchorPercentage < 0 ||
                    scrollOptions.anchorPercentage > 1
                ) {
                    scrollOptions.anchorPercentage = 0.5;
                }
            }

            scrollOptions.count = parseInt(valueParts[0]);
            if (isNaN(scrollOptions.count) || scrollOptions.count < 1) {
                scrollOptions.count = 1;
            }
        } else if (this.value && this.value.length > 0) {
            scrollOptions.count = parseInt(this.value);
            if (isNaN(scrollOptions.count) || scrollOptions.count < 1) {
                scrollOptions.count = 1;
            }
        }

        return scrollOptions;
    }
}

module.exports = BaseVerticalScrollStep;
