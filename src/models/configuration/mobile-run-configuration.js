const { pauseApp } = require('../../helpers/utils');
const RunConfiguration = require('./base-run-configuration');

class RunConfigurationMobile extends RunConfiguration {
    #platformName = '';
    #automationName = '';
    #deviceName = '';
    #app = '';
    #appPackage = '';
    #appActivity = '';
    #autoGrantPermissions = true;
    #forceAppInstall = false;
    #reset = true;

    constructor(options) {
        super(options);

        this.#platformName = options.appium.platformName ?? 'Android';
        this.#automationName = options.appium.automationName ?? 'UiAutomator2';
        this.#deviceName = options.appium.deviceName ?? 'Android';
        this.#app = options.appium.app ?? '';
        this.#appPackage = options.appium.appPackage ?? '';
        this.#appActivity = options.appium.appActivity ?? '';
        this.#autoGrantPermissions = options.appium.autoGrantPermissions ?? true;
        this.#reset = options.appium.reset ?? true;
        this.#forceAppInstall = options.appium.forceAppInstall ?? false;
    }

    get reset() {
        return this.#reset;
    }

    get forceAppInstall() {
        return this.#forceAppInstall;
    }

    get platformName() {
        return this.#platformName;
    }

    get appPackage() {
        return this.#appPackage;
    }

    async conf() {
        let wdio = {
            connectionRetryTimeout: 900000,
            hostname: this.hostname,
            port: this.port,
            logLevel: this.logLevel,
            capabilities: {}
        };

        if (this.farm === 'local') {
            wdio.capabilities['platformName'] = this.#platformName;
            wdio.capabilities[this.capabilityPropertyName('automationName')] = this.#automationName;
            wdio.capabilities[this.capabilityPropertyName('deviceName')] = this.#deviceName;
            wdio.capabilities[this.capabilityPropertyName('app')] = this.#app;
            wdio.capabilities[this.capabilityPropertyName('appPackage')] = this.#appPackage;
            wdio.capabilities[this.capabilityPropertyName('appActivity')] = this.#appActivity;
            wdio.capabilities[this.capabilityPropertyName('autoGrantPermissions')] = this.#autoGrantPermissions;
            if (!this.#reset) {
                wdio.capabilities[this.capabilityPropertyName('noReset')] = true;
            }
        } else if (this.farm === 'saucelabs') {
            wdio.user = this.user;
            wdio.key = this.user_key;
            wdio.hostname = this.hostname;
            wdio.port = this.port;
            wdio.baseUrl = 'wd/hub';
            wdio.capabilities['platformName'] = this.#platformName;
            wdio.capabilities[this.capabilityPropertyName('app')] = `storage:filename=${this.#app}`;
            wdio.capabilities[this.capabilityPropertyName('appPackage')] = this.#appPackage;
            wdio.capabilities[this.capabilityPropertyName('appActivity')] = this.#appActivity;
            wdio.capabilities[this.capabilityPropertyName('autoGrantPermissions')] = this.#autoGrantPermissions;
            wdio.capabilities[this.capabilityPropertyName('deviceName')] = this.#deviceName;
            wdio.capabilities[this.capabilityPropertyName('automationName')] =
                this.#platformName == 'android' ? 'UiAutomator2' : '';
            wdio.capabilities['sauce:options'] = {
                name: this.runName,
                appiumVersion: 'latest',
                deviceOrientation: 'PORTRAIT'
            };
        } else if (this.farm === 'aws') {
            // Implement AWS capabilities
            wdio['path'] = process.env.APPIUM_BASE_PATH;
            wdio.capabilities['platformName'] = process.env.DEVICEFARM_DEVICE_PLATFORM_NAME;
            wdio.capabilities[this.capabilityPropertyName('automationName')] = this.#automationName;
            wdio.capabilities[this.capabilityPropertyName('deviceName')] = process.env.DEVICEFARM_DEVICE_NAME;
            wdio.capabilities[this.capabilityPropertyName('app')] = process.env.DEVICEFARM_APP_PATH;
            wdio.capabilities[this.capabilityPropertyName('appPackage')] = this.#appPackage;
            wdio.capabilities[this.capabilityPropertyName('appActivity')] = this.#appActivity;
            wdio.capabilities[this.capabilityPropertyName('autoGrantPermissions')] = this.#autoGrantPermissions;
            if (!this.#reset) {
                wdio.capabilities[this.capabilityPropertyName('noReset')] = true;
            }
        }
        return wdio;
    }

    async startSession() {
        if (this.forceAppInstall) {
            console.log('Resetting device...');
            const resetDriver = await super.startSession();
            await resetDriver.execute('mobile: terminateApp', { appId: this.#appPackage });
            await resetDriver.removeApp(this.#appPackage);
            await resetDriver.deleteSession();
            console.log('Waiting for session to be closed properly');
            await pauseApp(20000);
        }

        const driver = await super.startSession();
        return driver;
    }

    capabilityPropertyName(name) {
        return `appium:${name}`;
    }
}

module.exports = RunConfigurationMobile;
