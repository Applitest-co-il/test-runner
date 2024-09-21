const { remote } = require('webdriverio');
const { TestRunnerConfigurationError } = require('../helpers/test-errors');
const { checkAppIsInstalled } = require('../helpers/mobile-utils');

class RunConfiguration {
    #runType = '';
    #farm = 'local';
    #hostname = 'localhost';
    #port = 4723;
    #logLevel = 'info';
    #keepSession = false;
    #startFromStep = -1;
    #stopAtStep = -1;

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
        this.#hostname = options.host ?? 'localhost';
        this.#port = options.port ?? 4723;
        this.#keepSession = options.keepSession ?? false;
        this.#startFromStep = options.startFromStep ?? -1;
        this.#stopAtStep = options.stopAtStep ?? -1;
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

    get keepSession() {
        return this.#keepSession;
    }

    set keepSession(value) {
        this.#keepSession = value;
    }

    get startFromStep() {
        return this.#startFromStep;
    }

    get stopAtStep() {
        return this.#stopAtStep;
    }

    set startFromStep(value) {
        this.#startFromStep = value;
    }

    set stopAtStep(value) {
        this.#stopAtStep = value;
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
    }

    get reset() {
        return this.#reset;
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

    get platformName() {
        return this.#platformName;
    }

    capabilityPropertyName(name) {
        return `appium:${name}`;
    }
}

class RunConfigurationWeb extends RunConfiguration {
    #browserName = '';
    #browserVersion = '';
    #startUrl = '';
    #incognito = false;
    #startMaximized = false;
    #resolution = '1920x1080';
    #emulate = '';

    #restoreEmulateFunc = null;

    constructor(options) {
        super(options);

        this.#browserName = options.browser.name ?? 'chrome';
        this.#browserVersion = options.browser.version ?? '';
        this.#resolution = options.browser.resolution ?? '1920x1080';
        this.#startUrl = options.browser.startUrl ?? '';
        this.#incognito = options.browser.incognito ?? false;
        this.#startMaximized = options.browser.startMaximized ?? false;
        this.#emulate = options.browser.emulate ?? false;

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

        // Apply browser-specific options
        if (this.#browserName === 'chrome') {
            wdio.capabilities['goog:chromeOptions'] = {
                args: []
            };
            if (this.#startMaximized) {
                wdio.capabilities['goog:chromeOptions'].args.push('--start-maximized');
            }
            if (this.#incognito) {
                wdio.capabilities['goog:chromeOptions'].args.push('--incognito');
            }
        } else if (this.#browserName === 'firefox') {
            wdio.capabilities['moz:firefoxOptions'] = {
                args: []
            };
            if (this.#incognito) {
                wdio.capabilities['moz:firefoxOptions'].args.push('-private-window');
            }
        }

        if (this.farm === 'local') {
            wdio.capabilities['browserName'] = this.#browserName;
        }

        if (this.farm === 'remote') {
            // Implement AWS capabilities
            let url = new URL(process.env.TR_FARM_SESSION_URL);
            wdio.protocol = url.protocol.replace(':', '');
            if (url.port) {
                wdio.port = parseInt(url.port);
            } else if (url.protocol === 'https:') {
                wdio.port = 443;
            }
            wdio.hostname = url.hostname;
            wdio.path = url.pathname;
        }

        return wdio;
    }

    async startSession() {
        let driver = await super.startSession();

        // Maximize or set window size based on browser
        if (this.#startMaximized) {
            if (this.#browserName === 'firefox') {
                await driver.maximizeWindow(); // Maximize Firefox window
            } else if (this.#browserName === 'chrome') {
                // Chrome is already maximized via 'start-maximized' argument
            }
        }

        if (this.#emulate) {
            this.#restoreEmulateFunc = await driver.emulate('device', this.#emulate);
        } else {
            if (this.#resolution) {
                let [width, height] = this.#resolution.split('x');
                await driver.setWindowSize(parseInt(width), parseInt(height));
            }
        }

        await driver.url(this.#startUrl);

        return driver;
    }
}

module.exports = {
    RunConfiguration,
    RunConfigurationMobile,
    RunConfigurationWeb
};
