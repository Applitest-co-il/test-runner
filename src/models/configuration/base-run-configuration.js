const { remote } = require('webdriverio');
const { TestRunnerConfigurationError, TestAbuseError } = require('../../helpers/test-errors');

class RunConfiguration {
    #runName = '';
    #runType = '';
    #farm = 'local';
    #hostname = 'localhost';
    #port = 4723;
    #user = '';
    #user_key = '';
    #logLevel = 'info';
    #keepSession = false;
    #startFromStep = -1;
    #stopAtStep = -1;
    #enableVideo = false;
    #videosPath = './reports/videos';
    #noFollowReset = false;

    constructor(options) {
        this.#runName = options.runName ?? `RUN ${new Date().toISOString()}`;
        this.#runType = options.runType ?? 'mobile';
        this.#farm = options.farm ?? process.env.TR_FARM ?? 'local';
        this.#logLevel = options.logLevel ?? 'error';
        this.#hostname = options.host ?? 'localhost';
        this.#port = options.port ?? 4723;
        this.#user = options.user ?? '';
        this.#user_key = options.user_key ?? '';
        this.#keepSession = options.keepSession ?? false;
        this.#startFromStep = options.startFromStep ?? -1;
        this.#stopAtStep = options.stopAtStep ?? -1;
        this.#enableVideo = options.enableVideo ?? false;
        this.#videosPath = options.videosPath ?? './reports/videos';
        this.#noFollowReset = options.noFollowReset ?? false;
    }

    get runName() {
        return this.#runName;
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

    get user() {
        return this.#user;
    }

    get user_key() {
        return this.#user_key;
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

    get noFollowReset() {
        return this.#noFollowReset;
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

    get enableVideo() {
        return this.#enableVideo;
    }

    get videosPath() {
        return this.#videosPath;
    }

    async conf(_) {
        return null;
    }

    capabilityPropertyName(name) {
        return name;
    }

    async startSession(sessionName) {
        console.log('Starting session...');

        let conf = null;
        try {
            conf = await this.conf(sessionName);

            console.log(`Starting driver with conf: ${JSON.stringify(conf)}`);

            let driver = await remote(conf);
            if (!driver) {
                console.error('Driver could not be set');
                throw new TestRunnerConfigurationError('Driver could not be set');
            }

            console.log(`Session started successfully: ${sessionName}`);

            return driver;
        } catch (err) {
            if (err.message.indexOf('CCYAbuse - too many jobs when running') > -1) {
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

module.exports = RunConfiguration;
