const RunConfiguration = require('./base-run-configuration');
const { TestRunnerConfigurationError } = require('../../helpers/test-errors');

class RunConfigurationWeb extends RunConfiguration {
    #browserName = '';
    #browserVersion = '';
    #startUrl = '';
    #incognito = false;
    #startMaximized = false;
    #resolution = '1920x1080';
    #emulate = '';

    #restoreEmulateFunc = null;

    constructor(options, session) {
        super(options);

        if (session.browser.farm) {
            this.farm = session.browser.farm;
        }
        this.#browserName = session.browser.name ?? 'chrome';
        this.#browserVersion = session.browser.version ?? 'latest';
        this.#platformName = session.browser.platform ?? '';
        this.#resolution = session.browser.resolution ?? '1920x1080';
        this.#startUrl = session.browser.startUrl ?? '';
        this.#incognito = session.browser.incognito ?? false;
        this.#startMaximized = session.browser.startMaximized ?? false;
        this.#emulate = session.browser.emulate ?? false;

        if (!this.#startUrl) {
            throw new TestRunnerConfigurationError('No start URL provided');
        }
    }

    async conf(sessionName) {
        let wdio = {
            connectionRetryTimeout: 900000,
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
            wdio.capabilities['goog:chromeOptions'].args.push('--log-level=1');
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
        } else if (this.farm === 'applitest') {
            let applitestHostname = 'selenium-chrome.applitest.co.il';
            if (this.#browserName === 'firefox') {
                applitestHostname = 'selenium-firefox.applitest.co.il';
            } else if (this.#browserName === 'MicrosoftEdge') {
                applitestHostname = 'selenium-edge.applitest.co.il';
            }

            wdio.protocol = 'https';
            wdio.hostname = applitestHostname;
            wdio.port = 443;
            wdio.path = '/wd/hub';

            wdio.capabilities['browserName'] = this.#browserName;
        } else if (this.farm === 'saucelabs') {
            const runName = sessionName || this.runName;

            wdio.user = this.user;
            wdio.key = this.user_key;
            wdio.hostname = this.hostname;
            wdio.port = this.port;
            wdio.path = '/wd/hub';

            wdio.capabilities['browserName'] = this.#browserName == 'edge' ? 'MicrosoftEdge' : this.#browserName;
            wdio.capabilities['browserVersion'] = this.#browserVersion;

            wdio.capabilities['sauce:options'] = {
                name: runName,
                recordScreenshots: false,
                commandTimeout: 600,
                idleTimeout: 600
            };
            if (this.#resolution) {
                wdio.capabilities['sauce:options'].screenResolution = this.#resolution;
            }
        } else if (this.farm === 'aws') {
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

        console.log(`Web configuration FINAL: ${JSON.stringify(wdio)}`);

        return wdio;
    }

    get restoreEmulateFunc() {
        return this.#restoreEmulateFunc;
    }

    async startSession(sessionName) {
        let driver = await super.startSession(sessionName);

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

        await driver.pause(5000);

        return driver;
    }
}

module.exports = RunConfigurationWeb;
