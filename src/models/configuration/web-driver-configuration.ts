import DriverConfiguration from './base-driver-configuration';
import { TestRunnerConfigurationError } from '../../helpers/test-errors';

class WebDriverConfiguration extends DriverConfiguration {
    private _browserName: string = '';
    private _browserVersion: string = '';
    private _startUrl: string = '';
    private _incognito: boolean = false;
    private _startMaximized: boolean = false;
    private _resolution: string = '1920x1080';
    private _emulate: string = '';

    private _restoreEmulateFunc: (() => void) | null = null;

    constructor(options: any, session: any) {
        super(options);

        if (session.browser.farm) {
            this.farm = session.browser.farm;
        }
        this._browserName = session.browser.name ?? 'chrome';
        this._browserVersion = session.browser.version ?? 'latest';
        this._resolution = session.browser.resolution ?? '1920x1080';
        this._startUrl = session.browser.startUrl ?? '';
        this._incognito = session.browser.incognito ?? false;
        this._startMaximized = session.browser.startMaximized ?? false;
        this._emulate = session.browser.emulate?.toString() ?? '';

        if (!this._startUrl) {
            throw new TestRunnerConfigurationError('No start URL provided');
        }
    }

    get browserName(): string {
        return this._browserName;
    }

    get browserVersion(): string {
        return this._browserVersion;
    }

    get startUrl(): string {
        return this._startUrl;
    }

    get incognito(): boolean {
        return this._incognito;
    }

    get startMaximized(): boolean {
        return this._startMaximized;
    }

    get resolution(): string {
        return this._resolution;
    }

    get emulate(): string {
        return this._emulate;
    }

    conf(sessionName: string): any | null {
        let wdio: any = {
            connectionRetryTimeout: 900000,
            logLevel: this.logLevel,
            capabilities: {
                browserName: this._browserName
            }
        };

        // Apply browser-specific options
        if (this._browserName === 'chrome') {
            wdio.capabilities['goog:chromeOptions'] = {
                args: []
            };
            if (this._startMaximized) {
                wdio.capabilities['goog:chromeOptions'].args.push('--start-maximized');
            }
            wdio.capabilities['goog:chromeOptions'].args.push('--log-level=1');
        } else if (this._browserName === 'firefox') {
            wdio.capabilities['moz:firefoxOptions'] = {
                args: []
            };
            if (this._incognito) {
                wdio.capabilities['moz:firefoxOptions'].args.push('-private-window');
            }
        }

        if (this.farm === 'local') {
            wdio.capabilities['browserName'] = this._browserName;
        } else if (this.farm === 'applitest') {
            let applitestHostname = 'selenium-chrome.applitest.co.il';
            if (this._browserName === 'firefox') {
                applitestHostname = 'selenium-firefox.applitest.co.il';
            } else if (this._browserName === 'MicrosoftEdge') {
                applitestHostname = 'selenium-edge.applitest.co.il';
            }

            wdio.protocol = 'https';
            wdio.hostname = applitestHostname;
            wdio.port = 443;
            wdio.path = '/wd/hub';

            wdio.capabilities['browserName'] = this._browserName;
        } else if (this.farm === 'saucelabs') {
            const runName = sessionName || this.runName;

            wdio.user = this.user;
            wdio.key = this.userKey;
            wdio.hostname = this.hostname;
            wdio.port = this.port;
            wdio.path = '/wd/hub';

            wdio.capabilities['browserName'] = this._browserName == 'edge' ? 'MicrosoftEdge' : this._browserName;
            wdio.capabilities['browserVersion'] = this._browserVersion;

            wdio.capabilities['sauce:options'] = {
                name: runName,
                recordScreenshots: false,
                commandTimeout: 600,
                idleTimeout: 600
            };
            if (this._resolution) {
                wdio.capabilities['sauce:options'].screenResolution = this._resolution;
            }
        }

        console.log(`Web configuration FINAL: ${JSON.stringify(wdio)}`);

        return wdio;
    }

    async afterDriverInit(driver: any): Promise<void> {
        if (this._resolution && this._resolution !== 'maximize' && !this._startMaximized && !this._emulate) {
            const [width, height] = this._resolution.split('x').map(Number);
            await driver.setWindowSize(width, height);
        }

        if (this._emulate && this._browserName.toLowerCase() === 'chrome') {
            this._restoreEmulateFunc = await driver.emulateDevice(this._emulate);
        }

        if (this._startUrl) {
            await driver.url(this._startUrl);
        }
    }

    async beforeDriverQuit(): Promise<void> {
        if (this._restoreEmulateFunc) {
            await this._restoreEmulateFunc();
        }
    }
}

export = WebDriverConfiguration;
