const RunConfiguration = require('./base-run-configuration');

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

module.exports = RunConfigurationWeb;
