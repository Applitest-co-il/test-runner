import { remote, Browser } from 'webdriverio';
import { TestRunnerConfigurationError, TestAbuseError } from '../../helpers/test-errors';

interface DriverConfigurationOptions {
    runName?: string;
    runType?: string;
    farm?: string;
    host?: string;
    port?: number;
    user?: string;
    user_key?: string;
    logLevel?: string;
    keepSession?: boolean;
    startFromStep?: number;
    stopAtStep?: number;
    enableVideo?: boolean;
    videosPath?: string;
    noFollowReset?: boolean;
}

class DriverConfiguration {
    private _runName: string = '';
    private _runType: string = '';
    private _farm: string = 'local';
    private _hostname: string = 'localhost';
    private _port: number = 4723;
    private _user: string = '';
    private _userKey: string = '';
    private _logLevel: string = 'info';
    private _keepSession: boolean = false;
    private _startFromStep: number = -1;
    private _stopAtStep: number = -1;
    private _enableVideo: boolean = false;
    private _videosPath: string = './reports/videos';
    private _noFollowReset: boolean = false;

    constructor(options: DriverConfigurationOptions) {
        this._runName = options.runName ?? `RUN ${new Date().toISOString()}`;
        this._runType = options.runType ?? 'mobile';
        this._farm = options.farm ?? process.env.TR_FARM ?? 'local';
        this._logLevel = options.logLevel ?? 'error';
        this._hostname = options.host ?? 'localhost';
        this._port = options.port ?? 4723;
        this._user = options.user ?? '';
        this._userKey = options.user_key ?? '';
        this._keepSession = options.keepSession ?? false;
        this._startFromStep = options.startFromStep ?? -1;
        this._stopAtStep = options.stopAtStep ?? -1;
        this._enableVideo = options.enableVideo ?? false;
        this._videosPath = options.videosPath ?? './reports/videos';
        this._noFollowReset = options.noFollowReset ?? false;
    }

    get runName(): string {
        return this._runName;
    }

    get runType(): string {
        return this._runType;
    }

    get farm(): string {
        return this._farm;
    }

    set farm(value: string) {
        this._farm = value;
    }

    get hostname(): string {
        return this._hostname;
    }

    get port(): number {
        return this._port;
    }

    get user(): string {
        return this._user;
    }

    get userKey(): string {
        return this._userKey;
    }

    get logLevel(): string {
        return this._logLevel;
    }

    get keepSession(): boolean {
        return this._keepSession;
    }

    set keepSession(value: boolean) {
        this._keepSession = value;
    }

    get noFollowReset(): boolean {
        return this._noFollowReset;
    }

    get startFromStep(): number {
        return this._startFromStep;
    }

    get stopAtStep(): number {
        return this._stopAtStep;
    }

    set startFromStep(value: number) {
        this._startFromStep = value;
    }

    set stopAtStep(value: number) {
        this._stopAtStep = value;
    }

    get enableVideo(): boolean {
        return this._enableVideo;
    }

    get videosPath(): string {
        return this._videosPath;
    }

    get platformName(): string {
        return '';
    }

    get appPackage(): string {
        return '';
    }

    conf(_: string): any | null {
        return null;
    }

    async afterDriverInit(_: any): Promise<void> {
        // To be overridden in subclasses if needed
    }

    capabilityPropertyName(name: string): string {
        return name;
    }

    async startSession(sessionName: string): Promise<Browser | null> {
        console.log('Starting session...');

        let conf: any | null = null;
        try {
            conf = await this.conf(sessionName);

            console.log(`Starting driver with conf: ${JSON.stringify(conf)}`);

            let driver = await remote(conf);
            if (!driver) {
                console.error('Driver could not be set');
                throw new TestRunnerConfigurationError('Driver could not be set');
            }

            await this.afterDriverInit(driver);

            console.log(`Session started successfully: ${sessionName}`);

            return driver;
        } catch (err) {
            if ((err as Error).message.indexOf('CCYAbuse') > -1) {
                const errMsg = conf
                    ? `Error: Too many jobs running on ${conf.hostname}`
                    : 'Error: Too many jobs running';
                console.error(errMsg);
                throw new TestAbuseError(errMsg);
            }
            console.error(`Error starting session: ${err}`);
            throw new TestRunnerConfigurationError(`Driver could not be set: ${err}`);
        }
    }
}

export = DriverConfiguration;
