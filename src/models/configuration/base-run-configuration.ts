import { remote } from 'webdriverio';
import { TestRunnerConfigurationError, TestAbuseError } from '../../helpers/test-errors';
import { ExtendedBrowser } from '../../types';

interface RunConfigurationOptions {
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

class RunConfiguration {
    private runName: string = '';
    private runType: string = '';
    private farm: string = 'local';
    private hostname: string = 'localhost';
    private port: number = 4723;
    private user: string = '';
    private user_key: string = '';
    private logLevel: string = 'info';
    private keepSession: boolean = false;
    private startFromStep: number = -1;
    private stopAtStep: number = -1;
    private enableVideo: boolean = false;
    private videosPath: string = './reports/videos';
    private noFollowReset: boolean = false;

    constructor(options: RunConfigurationOptions) {
        this.runName = options.runName ?? `RUN ${new Date().toISOString()}`;
        this.runType = options.runType ?? 'mobile';
        this.farm = options.farm ?? process.env.TR_FARM ?? 'local';
        this.logLevel = options.logLevel ?? 'error';
        this.hostname = options.host ?? 'localhost';
        this.port = options.port ?? 4723;
        this.user = options.user ?? '';
        this.user_key = options.user_key ?? '';
        this.keepSession = options.keepSession ?? false;
        this.startFromStep = options.startFromStep ?? -1;
        this.stopAtStep = options.stopAtStep ?? -1;
        this.enableVideo = options.enableVideo ?? false;
        this.videosPath = options.videosPath ?? './reports/videos';
        this.noFollowReset = options.noFollowReset ?? false;
    }

    get getRunName(): string {
        return this.runName;
    }

    get getRunType(): string {
        return this.runType;
    }

    get getFarm(): string {
        return this.farm;
    }

    set setFarm(value: string) {
        this.farm = value;
    }

    get getHostname(): string {
        return this.hostname;
    }

    get getPort(): number {
        return this.port;
    }

    get getUser(): string {
        return this.user;
    }

    get getUserKey(): string {
        return this.user_key;
    }

    get getLogLevel(): string {
        return this.logLevel;
    }

    get getKeepSession(): boolean {
        return this.keepSession;
    }

    set setKeepSession(value: boolean) {
        this.keepSession = value;
    }

    get getNoFollowReset(): boolean {
        return this.noFollowReset;
    }

    get getStartFromStep(): number {
        return this.startFromStep;
    }

    get getStopAtStep(): number {
        return this.stopAtStep;
    }

    set setStartFromStep(value: number) {
        this.startFromStep = value;
    }

    set setStopAtStep(value: number) {
        this.stopAtStep = value;
    }

    get getEnableVideo(): boolean {
        return this.enableVideo;
    }

    get getVideosPath(): string {
        return this.videosPath;
    }

    async conf(_: string): Promise<any | null> {
        return null;
    }

    capabilityPropertyName(name: string): string {
        return name;
    }

    async startSession(sessionName: string): Promise<ExtendedBrowser> {
        console.log('Starting session...');

        let conf: any | null = null;
        try {
            conf = await this.conf(sessionName);

            console.log(`Starting driver with conf: ${JSON.stringify(conf)}`);

            let driver = (await remote(conf!)) as any;
            if (!driver) {
                console.error('Driver could not be set');
                throw new TestRunnerConfigurationError('Driver could not be set');
            }

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

export = RunConfiguration;
