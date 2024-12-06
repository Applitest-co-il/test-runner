const BaseStep = require('./base-step');

class AppActivateStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const appId = this.value == 'current-app' ? this.conf.appPackage : this.value;
        await driver.execute('mobile: activateApp', { appId: appId });
    }
}

module.exports = AppActivateStep;
