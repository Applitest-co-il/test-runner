import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class MouseMoveStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _?: any): Promise<void> {
        const value = this.value;
        if (!value) {
            throw new TestRunnerError('MouseMove::No value provided');
        }

        const params = value.split('|||');
        if (params.length !== 3) {
            throw new TestRunnerError(
                `ClickCoordinates::Invalid coordinates value format "${value}" - format should be "<x>|||<y>|||<duration>"`
            );
        }

        const origin = params[0];
        if (origin !== 'pointer' && origin !== 'viewport') {
            throw new TestRunnerError(
                `MouseMove::Invalid origin value "${origin}" - should be "pointer" or "viewport"`
            );
        }

        const x = parseInt(params[1], 10);
        const y = parseInt(params[2], 10);

        const action = await driver.action('pointer', { parameters: { pointerType: 'mouse' } });
        await action.move({ origin: origin as 'pointer' | 'viewport', x: x, y: y, duration: 100 });
        await action.pause(100);
        await action.perform();
    }
}
