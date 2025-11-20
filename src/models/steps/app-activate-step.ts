import BaseStep from './base-step';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

export default class AppActivateStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.takeSnapshot = true;
    }

    async execute(driver: Browser, _: any): Promise<void> {
        const conf = this.conf;
        const appId = this.value === 'current-app' ? conf?.appPackage : this.value;
        const options = conf?.platformName.toLowerCase() === 'android' ? { appId: appId } : { bundleId: appId };
        await driver.execute('mobile: activateApp', options);
    }
}
