import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

export default class WaitForExistStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const valueParts = (this.value || '').split('|||');

        let timeout = 5000;
        let waitType = 'exist';
        if (valueParts.length == 2) {
            timeout = valueParts[0] ? parseInt(valueParts[0]) : 5000;
            waitType = valueParts[1] || 'exist';
        } else if (valueParts.length == 1) {
            timeout = valueParts[0] ? parseInt(valueParts[0]) : 5000;
        }

        try {
            await driver.waitUntil(
                async () => {
                    let item = await this.selectItem(driver);
                    if (!item) {
                        await this.addFrameToVideo(true);
                        return false;
                    } else {
                        switch (waitType.trim().toLowerCase()) {
                            case 'is-displayed':
                                if (!(await item.isDisplayed({ withinViewport: true }))) {
                                    await this.addFrameToVideo(true);
                                    return false;
                                }
                                break;

                            case 'is-clickable':
                                if (this.session?.type !== 'web') {
                                    if (!(await item.isDisplayed({ withinViewport: true }))) {
                                        await this.addFrameToVideo(true);
                                        return false;
                                    }
                                }
                                if (!(await item.isClickable())) {
                                    await this.addFrameToVideo(true);
                                    return false;
                                }
                                break;

                            default:
                                break;
                        }

                        await this.highlightElement(driver, item);
                        await driver.pause(500);
                        await this.revertElement(driver, item);
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch {
            throw new TestRunnerError(
                `Element with ${this.namedElementOrUsedSelectorsComment} did not appear on screen up to ${timeout}ms`
            );
        }
    }
}
