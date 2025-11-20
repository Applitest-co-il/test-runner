import { pauseApp } from '../../helpers/utils';
import DriverConfiguration from './base-driver-configuration';

class MobileDriverConfiguration extends DriverConfiguration {
    private _platformName: string = '';
    private _automationName: string = '';
    private _deviceName: string = '';
    private _app: string = '';
    private _appPackage: string = '';
    private _appActivity: string = '';
    private _autoGrantPermissions: boolean = true;
    private _forceAppInstall: boolean = false;
    private _reset: boolean = true;
    private _deviceLock: boolean = false;
    private _orientation: string = 'PORTRAIT';
    private _cacheId: string = '0';

    constructor(options: any, session: any) {
        super(options);

        if (session.appium.farm) {
            this.farm = session.appium.farm;
        }
        this._platformName = session.appium.platformName ?? 'Android';
        this._automationName = session.appium.automationName ?? 'UiAutomator2';
        this._deviceName = session.appium.deviceName ?? 'Android';
        this._app = session.appium.app ?? '';
        this._appPackage = session.appium.appPackage ?? '';
        this._appActivity = session.appium.appActivity ?? '';
        this._autoGrantPermissions = session.appium.autoGrantPermissions ?? true;
        this._reset = session.appium.reset ?? true;
        this._forceAppInstall = session.appium.forceAppInstall ?? false;
        this._deviceLock = session.appium.deviceLock ?? false;
        this._orientation = session.appium.orientation ?? 'PORTRAIT';
        this._cacheId = session.appium.cacheId ?? '0';
    }

    get platformName(): string {
        return this._platformName;
    }

    get automationName(): string {
        return this._automationName;
    }

    get deviceName(): string {
        return this._deviceName;
    }

    get app(): string {
        return this._app;
    }

    get appPackage(): string {
        return this._appPackage;
    }

    get appActivity(): string {
        return this._appActivity;
    }

    get autoGrantPermissions(): boolean {
        return this._autoGrantPermissions;
    }

    get forceAppInstall(): boolean {
        return this._forceAppInstall;
    }

    get reset(): boolean {
        return this._reset;
    }

    get deviceLock(): boolean {
        return this._deviceLock;
    }

    get orientation(): string {
        return this._orientation;
    }

    get cacheId(): string {
        return this._cacheId;
    }

    conf(sessionName: string): any | null {
        let wdio: any = {
            connectionRetryTimeout: 900000,
            hostname: this.hostname,
            port: this.port,
            logLevel: this.logLevel,
            capabilities: {}
        };

        if (this.farm === 'local') {
            wdio.capabilities['platformName'] = this._platformName;
            wdio.capabilities['appium:automationName'] = this._automationName;
            wdio.capabilities['appium:deviceName'] = this._deviceName;
            wdio.capabilities['appium:app'] = this._app;
            wdio.capabilities['appium:appPackage'] = this._appPackage;
            wdio.capabilities['appium:appActivity'] = this._appActivity;
            wdio.capabilities['appium:autoGrantPermissions'] = this._autoGrantPermissions;
            wdio.capabilities['appium:autoAcceptAlerts'] = this._autoGrantPermissions;
            wdio.capabilities['appium:newCommandTimeout'] = 90;
            if (this._platformName === 'android') {
                wdio.capabilities['appium:enableMultiWindows'] = true;
            }
            if (!this._reset) {
                wdio.capabilities['appium:noReset'] = true;
            }
        } else if (this.farm === 'saucelabs') {
            const runName = sessionName || this.runName;

            wdio.user = this.user;
            wdio.key = this.userKey;
            wdio.hostname = this.hostname;
            wdio.port = this.port;
            wdio.baseUrl = 'wd/hub';
            wdio.capabilities['platformName'] = this._platformName.toLowerCase();
            wdio.capabilities['appium:app'] = `storage:filename=${this._app}`;
            wdio.capabilities['appium:appPackage'] = this._appPackage;
            if (this._appActivity != 'NA') {
                wdio.capabilities['appium:appActivity'] = this._appActivity;
            }
            wdio.capabilities['appium:autoGrantPermissions'] = this._autoGrantPermissions;
            wdio.capabilities['appium:autoAcceptAlerts'] = this._autoGrantPermissions;
            wdio.capabilities['appium:deviceName'] = this._deviceName;
            wdio.capabilities['appium:automationName'] = this._platformName == 'android' ? 'UiAutomator2' : 'XCUITest';
            wdio.capabilities['appium:newCommandTimeout'] = 90;
            wdio.capabilities['appium:orientation'] = this._orientation;
            if (this._platformName === 'android') {
                wdio.capabilities['appium:enableMultiWindows'] = true;
            }
            wdio.capabilities['sauce:options'] = {
                name: runName,
                appiumVersion: 'latest',
                deviceOrientation: this._orientation,
                setupDeviceLock: this._deviceLock,
                recordScreenshots: false,
                resigningEnabled: this._platformName == 'android' ? false : true,
                cacheId: this._cacheId
            };
        }

        return wdio;
    }

    async afterDriverInit(): Promise<void> {
        if (this._reset && this._appPackage) {
            await pauseApp(20000);
        }
    }
}

export = MobileDriverConfiguration;
