import { pauseApp } from '../../helpers/utils';
import RunConfiguration = require('./base-run-configuration');

interface AppiumSession {
    appium: {
        farm?: string;
        platformName?: string;
        automationName?: string;
        deviceName?: string;
        app?: string;
        appPackage?: string;
        appActivity?: string;
        autoGrantPermissions?: boolean;
        forceAppInstall?: boolean;
        reset?: boolean;
        deviceLock?: boolean;
        orientation?: string;
        cacheId?: string;
    };
}

class RunConfigurationMobile extends RunConfiguration {
    #platformName: string = '';
    #automationName: string = '';
    #deviceName: string = '';
    #app: string = '';
    #appPackage: string = '';
    #appActivity: string = '';
    #autoGrantPermissions: boolean = true;
    #forceAppInstall: boolean = false;
    #reset: boolean = true;
    #deviceLock: boolean = false;
    #orientation: string = 'PORTRAIT';
    #cacheId: string = '0';

    constructor(options: any, session: any) {
        super(options);

        if (session.appium.farm) {
            this.setFarm = session.appium.farm;
        }
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
        this.#cacheId = session.appium.cacheId ?? '0';
    }

    get platformName(): string {
        return this.#platformName;
    }

    get automationName(): string {
        return this.#automationName;
    }

    get deviceName(): string {
        return this.#deviceName;
    }

    get app(): string {
        return this.#app;
    }

    get appPackage(): string {
        return this.#appPackage;
    }

    get appActivity(): string {
        return this.#appActivity;
    }

    get autoGrantPermissions(): boolean {
        return this.#autoGrantPermissions;
    }

    get forceAppInstall(): boolean {
        return this.#forceAppInstall;
    }

    get reset(): boolean {
        return this.#reset;
    }

    get deviceLock(): boolean {
        return this.#deviceLock;
    }

    get orientation(): string {
        return this.#orientation;
    }

    get cacheId(): string {
        return this.#cacheId;
    }

    getCaps(): any {
        const options: any = {
            'appium:platformName': this.#platformName,
            'appium:automationName': this.#automationName,
            'appium:deviceName': this.#deviceName,
            'appium:autoGrantPermissions': this.#autoGrantPermissions,
            'appium:fullReset': this.#reset
        };

        if (this.#app) {
            options['appium:app'] = this.#app;
        }

        if (this.#appPackage) {
            options['appium:appPackage'] = this.#appPackage;
        }

        if (this.#appActivity) {
            options['appium:appActivity'] = this.#appActivity;
        }

        if (this.#forceAppInstall) {
            options['appium:forceAppInstall'] = true;
        }

        if (this.#deviceLock) {
            options['appium:deviceLock'] = true;
        }

        if (this.#orientation) {
            options['appium:orientation'] = this.#orientation;
        }

        return options;
    }

    async afterDriverInit(driver: any): Promise<void> {
        if (this.#reset && this.#appPackage) {
            await pauseApp(20000);
        }
    }
}

export = RunConfigurationMobile;
