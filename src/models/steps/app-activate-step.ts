import BaseStep = require('./base-step');
import { TestStep, ExtendedBrowser } from '../../types';

export default class AppActivateStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);

        this.setTakeSnapshot = true;
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const conf = this.getConf;
        const appId = this.getValue === 'current-app' ? conf.appPackage : this.getValue;
        const options = conf.platformName.toLowerCase() === 'android' ? { appId: appId } : { bundleId: appId };
        await driver.execute('mobile: activateApp', options);
    }
}
