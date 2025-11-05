import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class ClickCoordinatesStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setHideKeyboard = true;
        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('ClickCoordinates::No value provided');
        }

        const params = value.split('|||');
        if (params.length < 2 || params.length > 3) {
            throw new TestRunnerError(
                `ClickCoordinates::Invalid coordinates value format "${value}" - format should be "<x>|||<y>|||<duration>"`
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

        const session = this.getSession;
        const pointerType = session?.type == 'mobile' ? 'touch' : 'mouse';

        if (isNaN(x) || isNaN(y)) {
            throw new TestRunnerError(
                `ClickCoordinates::Coordinates should be numbers in "${value}" - format should be "<x>|||<y>"`
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
