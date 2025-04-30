const BaseStep = require('./base-step');

class AppActivateStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const appId = this.value == 'current-app' ? this.conf.appPackage : this.value;
        const options = this.conf.platformName.toLowerCase() === 'android' ? { appId: appId } : { bundleId: appId };
        await driver.execute('mobile: activateApp', options);
    }
}

module.exports = AppActivateStep;
