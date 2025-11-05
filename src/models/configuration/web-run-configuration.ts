import RunConfiguration = require('./base-run-configuration');
import { TestRunnerConfigurationError } from '../../helpers/test-errors';

interface BrowserSession {
    browser: {
        farm?: string;
        name?: string;
        version?: string;
        resolution?: string;
        startUrl?: string;
        incognito?: boolean;
        startMaximized?: boolean;
        emulate?: string | boolean;
    };
}

class RunConfigurationWeb extends RunConfiguration {
    #browserName: string = '';
    #browserVersion: string = '';
    #startUrl: string = '';
    #incognito: boolean = false;
    #startMaximized: boolean = false;
    #resolution: string = '1920x1080';
    #emulate: string = '';

    #restoreEmulateFunc: (() => void) | null = null;

    constructor(options: any, session: any) {
        super(options);

        if (session.browser.farm) {
            this.setFarm = session.browser.farm;
        }
        this.#browserName = session.browser.name ?? 'chrome';
        this.#browserVersion = session.browser.version ?? 'latest';
        this.#resolution = session.browser.resolution ?? '1920x1080';
        this.#startUrl = session.browser.startUrl ?? '';
        this.#incognito = session.browser.incognito ?? false;
        this.#startMaximized = session.browser.startMaximized ?? false;
        this.#emulate = session.browser.emulate?.toString() ?? '';

        if (!this.#startUrl) {
            throw new TestRunnerConfigurationError('No start URL provided');
        }
    }

    get browserName(): string {
        return this.#browserName;
    }

    get browserVersion(): string {
        return this.#browserVersion;
    }

    get startUrl(): string {
        return this.#startUrl;
    }

    get incognito(): boolean {
        return this.#incognito;
    }

    get startMaximized(): boolean {
        return this.#startMaximized;
    }

    get resolution(): string {
        return this.#resolution;
    }

    get emulate(): string {
        return this.#emulate;
    }

    getCaps(): any {
        const options: any = {
            browserName: this.#browserName
        };

        if (this.#browserVersion && this.#browserVersion !== 'latest') {
            options.browserVersion = this.#browserVersion;
        }

        if (this.#incognito) {
            switch (this.#browserName.toLowerCase()) {
                case 'chrome':
                    options['goog:chromeOptions'] = {
                        args: ['--incognito']
                    };
                    break;
                case 'firefox':
                    options['moz:firefoxOptions'] = {
                        args: ['-private']
                    };
                    break;
                case 'edge':
                    options['ms:edgeOptions'] = {
                        args: ['--inprivate']
                    };
                    break;
            }
        }

        if (this.#startMaximized) {
            switch (this.#browserName.toLowerCase()) {
                case 'chrome':
                    if (!options['goog:chromeOptions']) {
                        options['goog:chromeOptions'] = { args: [] };
                    }
                    options['goog:chromeOptions'].args.push('--start-maximized');
                    break;
                case 'firefox':
                    if (!options['moz:firefoxOptions']) {
                        options['moz:firefoxOptions'] = { args: [] };
                    }
                    options['moz:firefoxOptions'].args.push('--kiosk');
                    break;
                case 'edge':
                    if (!options['ms:edgeOptions']) {
                        options['ms:edgeOptions'] = { args: [] };
                    }
                    options['ms:edgeOptions'].args.push('--start-maximized');
                    break;
            }
        }

        if (this.#emulate) {
            switch (this.#browserName.toLowerCase()) {
                case 'chrome':
                    if (!options['goog:chromeOptions']) {
                        options['goog:chromeOptions'] = {};
                    }
                    options['goog:chromeOptions'].mobileEmulation = {
                        deviceName: this.#emulate
                    };
                    break;
            }
        }

        return options;
    }

    async afterDriverInit(driver: any): Promise<void> {
        if (this.#resolution && this.#resolution !== 'maximize' && !this.#startMaximized && !this.#emulate) {
            const [width, height] = this.#resolution.split('x').map(Number);
            await driver.setWindowSize(width, height);
        }

        if (this.#emulate && this.#browserName.toLowerCase() === 'chrome') {
            this.#restoreEmulateFunc = await driver.emulateDevice(this.#emulate);
        }

        if (this.#startUrl) {
            await driver.url(this.#startUrl);
        }
    }

    async beforeDriverQuit(driver: any): Promise<void> {
        if (this.#restoreEmulateFunc) {
            await this.#restoreEmulateFunc();
        }
    }
}

export = RunConfigurationWeb;
