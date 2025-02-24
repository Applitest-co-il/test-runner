const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class MouseMoveStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const params = this.value.split('|||');
        if (params.length != 3) {
            throw new TestRunnerError(
                `ClickCoordinates::Invalid coordinates value format "${this.value}" - format should be "<x>|||<y>|||<duration>"`
            );
        }

        let origin = params[0];
        if (origin != 'pointer' && origin != 'viewport') {
            throw new TestRunnerError(
                `MouseMove::Invalid origin value "${origin}" - should be "pointer" or "viewport"`
            );
        }

        let x = parseInt(params[1]);
        let y = parseInt(params[2]);

        const action = await driver.action('pointer', { pointerType: 'mouse' });
        await action.move({ origin: origin, x: x, y: y, duration: 100 });
        await action.pause(100);
        await action.perform();
    }
}

module.exports = MouseMoveStep;
