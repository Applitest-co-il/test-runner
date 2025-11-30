import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

abstract class BaseHorizontalScrollStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        throw new TestRunnerError(`Execute method is not implemented - ${driver} - ${item}`);
    }

    async horizontalScroll(
        driver: Browser,
        originItem: ChainablePromiseElement | null,
        left: boolean = true
    ): Promise<void> {
        const value = this.value;
        const count = value ? parseInt(value) : 1;

        const startPercentage = originItem ? 0 : left ? 0.1 : 0.9;
        const endPercentage = originItem ? 0.3 : left ? 0.9 : 0.1;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorY = originItem ? 0 : Math.floor(height * anchorPercentage);
        const startX = originItem ? 0 : Math.floor(width * startPercentage);
        const endX = Math.floor(width * endPercentage);
        const fixedScroll = left ? -endX : endX;
        const scrollX = originItem ? fixedScroll : endX - startX;
        const session = this.session;
        const pointerType = session?.type == 'mobile' ? 'touch' : 'mouse';

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
            await this.addFrameToVideo(true);
        }
        return;
    }
}

export = BaseHorizontalScrollStep;
