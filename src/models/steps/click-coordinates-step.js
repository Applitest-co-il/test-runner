const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class ClickCoordinatesStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const params = this.value.split('|||');
        if (params.length < 2 || params.length > 3) {
            throw new TestRunnerError(
                `ClickCoordinates::Invalid coordinates value format "${this.value}" - format should be "<x>|||<y>|||<duration>"`
            );
        }

        let x = 0;
        let y = 0;
        let duration = params.length === 3 ? parseInt(params[2]) : 10;

        if (params[0].includes('%') || params[1].includes('%')) {
            const { width, height } = await driver.getWindowSize();

            if (params[0].includes('%')) {
                x = parseInt(params[0].replace('%', '')) * width * 0.01;
            } else {
                x = parseInt(params[0]);
            }
            if (params[1].includes('%')) {
                y = parseInt(params[1].replace('%', '')) * height * 0.01;
            } else {
                y = parseInt(params[1]);
            }
        } else {
            x = parseInt(params[0]);
            y = parseInt(params[1]);
        }

        const pointerType = this.conf.runType == 'mobile' ? 'touch' : 'mouse';

        if (isNaN(x) || isNaN(y)) {
            throw new TestRunnerError(
                `ClickCoordinates::Coordinates should be numbers in "${this.value}" - format should be "<x>|||<y>"`
            );
        }

        await driver
            .action('pointer', {
                parameters: { pointerType: pointerType }
            })
            .move({ origin: 'viewport', duration: 100, x: x, y: y })
            .pause(10)
            .down()
            .pause(duration)
            .up()
            .perform();
    }
}

module.exports = ClickCoordinatesStep;
