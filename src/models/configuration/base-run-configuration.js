const { remote } = require('webdriverio');
const { TestRunnerConfigurationError } = require('../../helpers/test-errors');

class RunConfiguration {
    #runType = '';
    #farm = 'local';
    #hostname = 'localhost';
    #port = 4723;
    #logLevel = 'info';
    #keepSession = false;
    #startFromStep = -1;
    #stopAtStep = -1;
    #enableVideo = false;

    constructor(options) {
        this.#runType = options.runType ?? 'mobile';
        this.#farm = options.farm ?? process.env.TR_FARM ?? 'local';
        this.#logLevel = options.logLevel ?? 'error';
        this.#hostname = options.host ?? 'localhost';
        this.#port = options.port ?? 4723;
        this.#keepSession = options.keepSession ?? false;
        this.#startFromStep = options.startFromStep ?? -1;
        this.#stopAtStep = options.stopAtStep ?? -1;
        this.#enableVideo = options.enableVideo ?? false;
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
        console.log('Starting session...');
        let driver = await remote(this.conf);
        if (!driver) {
            console.error('Driver could not be set');
            throw new TestRunnerConfigurationError('Driver could not be set');
        }
        return driver;
    }
}

module.exports = RunConfiguration;
