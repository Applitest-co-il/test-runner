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
    #deviceLock = false;
    #orientation = 'PORTRAIT';
    #cacheId = '0';

    constructor(options, session) {
        super(options);

        this.#platformName = session.appium.platformName ?? 'Android';
        this.#automationName = session.appium.automationName ?? 'UiAutomator2';
        this.#deviceName = session.appium.deviceName ?? 'Android';
        this.#app = session.appium.app ?? '';
        this.#appPackage = session.appium.appPackage ?? '';
        this.#appActivity = session.appium.appActivity ?? '';
        this.#autoGrantPermissions = session.appium.autoGrantPermissions ?? true;
        this.#reset = session.appium.reset ?? true;
        this.#forceAppInstall = session.appium.forceAppInstall ?? false;
        this.#deviceLock = session.appium.deviceLock ?? false;
        this.#orientation = session.appium.orientation ?? 'PORTRAIT';
        this.#cacheId = new Date().getTime().toString();
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

    get orientation() {
        return this.#orientation;
    }

    async conf(sessionName) {
        let wdio = {
            connectionRetryTimeout: 900000,
            hostname: this.hostname,
            port: this.port,
            logLevel: this.logLevel,
            capabilities: {}
        };

        if (this.farm === 'local') {
            wdio.capabilities['platformName'] = this.#platformName;
            wdio.capabilities['appium:automationName'] = this.#automationName;
            wdio.capabilities['appium:deviceName'] = this.#deviceName;
            wdio.capabilities['appium:app'] = this.#app;
            wdio.capabilities['appium:appPackage'] = this.#appPackage;
            wdio.capabilities['appium:appActivity'] = this.#appActivity;
            wdio.capabilities['appium:autoGrantPermissions'] = this.#autoGrantPermissions;
            wdio.capabilities['appium:autoAcceptAlerts'] = this.#autoGrantPermissions;
            wdio.capabilities['appium:newCommandTimeout'] = 90;
            if (this.#platformName === 'android') {
                wdio.capabilities['appium:enableMultiWindows'] = true;
            }
            if (!this.#reset) {
                wdio.capabilities['appium:noReset'] = true;
            }
        } else if (this.farm === 'saucelabs') {
            const runName = sessionName || this.runName;

            wdio.user = this.user;
            wdio.key = this.user_key;
            wdio.hostname = this.hostname;
            wdio.port = this.port;
            wdio.baseUrl = 'wd/hub';
            wdio.capabilities['platformName'] = this.#platformName.toLowerCase();
            wdio.capabilities['appium:app'] = `storage:filename=${this.#app}`;
            wdio.capabilities['appium:appPackage'] = this.#appPackage;
            if (this.#appActivity != 'NA') {
                wdio.capabilities['appium:appActivity'] = this.#appActivity;
            }
            wdio.capabilities['appium:autoGrantPermissions'] = this.#autoGrantPermissions;
            wdio.capabilities['appium:autoAcceptAlerts'] = this.#autoGrantPermissions;
            wdio.capabilities['appium:deviceName'] = this.#deviceName;
            wdio.capabilities['appium:automationName'] = this.#platformName == 'android' ? 'UiAutomator2' : 'XCUITest';
            wdio.capabilities['appium:newCommandTimeout'] = 90;
            wdio.capabilities['appium:orientation'] = this.#orientation;
            if (this.#platformName === 'android') {
                wdio.capabilities['appium:enableMultiWindows'] = true;
            }
            wdio.capabilities['sauce:options'] = {
                name: runName,
                appiumVersion: 'latest',
                deviceOrientation: this.#orientation,
                setupDeviceLock: this.#deviceLock,
                recordScreenshots: false,
                resigningEnabled: this.#platformName == 'android' ? false : true,
                cacheId: this.#cacheId
            };
        } else if (this.farm === 'aws') {
            // Implement AWS capabilities
            wdio['path'] = process.env.APPIUM_BASE_PATH;
            wdio.capabilities['platformName'] = process.env.DEVICEFARM_DEVICE_PLATFORM_NAME;
            wdio.capabilities['appium:automationName'] = this.#automationName;
            wdio.capabilities['appium:deviceName'] = process.env.DEVICEFARM_DEVICE_NAME;
            wdio.capabilities['appium:app'] = process.env.DEVICEFARM_APP_PATH;
            wdio.capabilities['appium:appPackage'] = this.#appPackage;
            wdio.capabilities['appium:appActivity'] = this.#appActivity;
            wdio.capabilities['appium:autoGrantPermissions'] = this.#autoGrantPermissions;
            if (!this.#reset) {
                wdio.capabilities['appium:noReset'] = true;
            }
        }
        return wdio;
    }

    async startSession(sessionName) {
        if (this.forceAppInstall) {
            console.log('Resetting device...');
            const resetDriver = await super.startSession(`${sessionName}-reset`);
            await resetDriver.execute('mobile: terminateApp', { appId: this.#appPackage });
            await resetDriver.removeApp(this.#appPackage);
            await resetDriver.deleteSession();
            console.log('Waiting for session to be closed properly');
            await pauseApp(20000);
        }

        const driver = await super.startSession(sessionName);

        return driver;
    }
}

module.exports = RunConfigurationMobile;
