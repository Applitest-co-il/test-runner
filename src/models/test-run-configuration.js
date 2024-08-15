const { remote } = require('webdriverio');
const { TestRunnerConfigurationError } = require('../helpers/test-errors');

class RunConfiguration {
    #runType = '';
    #farm = 'local';
    #hostname = 'localhost';
    #port = 4723;
    #logLevel = 'info';
    #reset = true;

    static factory(options) {
        if (!options) {
            throw new TestRunnerConfigurationError('No options provided');
        }

        if (!options.runType) {
            throw new TestRunnerConfigurationError('No run type provided');
        }

        switch (options.runType) {
            case 'mobile':
                return new RunConfigurationMobile(options);
            case 'web':
                return new RunConfigurationWeb(options);
            default:
                throw new TestRunnerConfigurationError('Invalid run type provided');
        }
    }

    constructor(options) {
        this.#runType = options.runType ?? 'mobile';
        this.#farm = options.farm ?? process.env.TR_FARM ?? 'local';
        this.#logLevel = options.logLevel ?? 'info';
        this.#reset = options.reset ?? true;
        this.#hostname = options.host ?? 'localhost';
        this.#port = options.port ?? 4723;
    }

    get runType() {
        return this.#runType;
    }

    get farm() {
        return this.#farm;
    }

    get hostname() {
        return this.#hostname;
    }

    get port() {
        return this.#port;
    }

    get logLevel() {
        return this.#logLevel;
    }

    get reset() {
        return this.#reset;
    }

    get conf() {
        return null;
    }

    capabilityPropertyName(name) {
        return name;
    }

    async startSession() {
        let driver = await remote(this.conf);
        if (!driver) {
            console.error('Driver could not be set');
            throw new TestRunnerConfigurationError('Driver could not be set');
        }
        return driver;
    }

    async closeSession(driver) {
        if (driver) {
            await driver.deleteSession();
        }
    }
}

class RunConfigurationMobile extends RunConfiguration {
    #platformName = '';
    #automationName = '';
    #deviceName = '';
    #app = '';
    #appPackage = '';
    #appActivity = '';
    #autoGrantPermissions = true;

    constructor(options) {
        super(options);

        this.#platformName = options.appium.platformName ?? 'Android';
        this.#automationName = options.appium.automationName ?? 'UiAutomator2';
        this.#deviceName = options.appium.deviceName ?? 'Android';
        this.#app = options.appium.app ?? '';
        this.#appPackage = options.appium.appPackage ?? '';
        this.#appActivity = options.appium.appActivity ?? '';
        this.#autoGrantPermissions = options.appium.autoGrantPermissions ?? true;
    }

    get conf() {
        let wdio = {
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
            wdio.capabilities[this.capabilityPropertyName('noReset')] = !this.reset;
            wdio.capabilities[this.capabilityPropertyName('autoGrantPermissions')] = this.#autoGrantPermissions;
        } else if (this.farm === 'aws') {
            // Implement AWS capabilities
            wdio['path'] = process.env.APPIUM_BASE_PATH;
            wdio.capabilities['platformName'] = process.env.DEVICEFARM_DEVICE_PLATFORM_NAME;
            wdio.capabilities[this.capabilityPropertyName('automationName')] = this.#automationName;
            wdio.capabilities[this.capabilityPropertyName('deviceName')] = process.env.DEVICEFARM_DEVICE_NAME;
            wdio.capabilities[this.capabilityPropertyName('app')] = process.env.DEVICEFARM_APP_PATH;
            wdio.capabilities[this.capabilityPropertyName('appPackage')] = this.#appPackage;
            wdio.capabilities[this.capabilityPropertyName('appActivity')] = this.#appActivity;
            wdio.capabilities[this.capabilityPropertyName('noReset')] = false;
            wdio.capabilities[this.capabilityPropertyName('autoGrantPermissions')] = this.#autoGrantPermissions;
        }
        return wdio;
    }

    capabilityPropertyName(name) {
        return `appium:${name}`;
    }
}

class RunConfigurationWeb extends RunConfiguration {
    #browserName = '';
    #browserVersion = '';
    #resolution = '1920x1080';
    #startUrl = '';

    constructor(options) {
        super(options);

        this.#browserName = options.browser.name ?? 'chrome';
        this.#browserVersion = options.browser.version ?? '';
        this.#resolution = options.browser.resolution ?? '1920x1080';
        this.#startUrl = options.browser.startUrl ?? '';

        if (!this.#startUrl) {
            throw new TestRunnerConfigurationError('No start URL provided');
        }
    }

    get conf() {
        let wdio = {
            connectionRetryTimeout: 180000,
            logLevel: this.logLevel,
            capabilities: {
                browserName: this.#browserName
            }
        };

        if (this.farm === 'local') {
            wdio.capabilities['browserName'] = this.#browserName;
        }

        if (this.farm === 'aws') {
            // Implement AWS capabilities
            let url = new URL(process.env.TR_FARM_SESSION_URL);
            wdio.protocol = 'https';
            wdio.port = 443;
            wdio.hostname = url.hostname;
            wdio.path = url.pathname;
        }

        return wdio;
    }

    async startSession() {
        let driver = await super.startSession();
        await driver.url(this.#startUrl);
        return driver;
    }
}

module.exports = {
    RunConfiguration,
    RunConfigurationMobile,
    RunConfigurationWeb
};
