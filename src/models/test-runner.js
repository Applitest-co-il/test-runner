const { TestRunnerError, TestAbuseError } = require('../helpers/test-errors');
const Suite = require('./suite');
const TRFunction = require('./function');
const TRApi = require('./api');
const { runConfigurationFactory } = require('./test-run-configuration');
const { mergeVariables, pauseApp } = require('../helpers/utils');
const SessionPinger = require('../helpers/session-pinger');
const { downloadFile } = require('../helpers/download-file');
const { checkArrayMaxItems } = require('../helpers/security');

const MAX_ITEMS = 1000;

class TestRunner {
    static #savedWebDriver = null;
    static #savedMobileDriver = null;

    #runConfiguration = null;
    #sessions = [];
    #sessionPinger = null;

    #suites = [];
    #functions = [];
    #apis = [];
    #variables = {};

    constructor(options) {
        this.#runConfiguration = options.runConfiguration;
        this.#variables = options.variables ?? {};

        this.initSuites(options);
        this.initFunctions(options);
        this.initApis(options);

        if (
            this.#suites.length > 1 &&
            (this.#runConfiguration.startFromStep > 0 ||
                this.#runConfiguration.stopAtStep > 0 ||
                this.#runConfiguration.keepSession)
        ) {
            console.log('Multiple suites found - startFromStep, stopAtStep and keepSession will be ignored');
            this.#runConfiguration.startFromStep = -1;
            this.#runConfiguration.stopAtStep = -1;
            this.#runConfiguration.keepSession = false;
        }
    }

    get sessions() {
        return this.#sessions;
    }

    get variables() {
        return this.#variables;
    }

    get suites() {
        return this.#suites;
    }

    getSession(type) {
        return this.#sessions.find((session) => session.type === type);
    }

    async initSuites(options) {
        console.log('Init suites...');

        this.#suites = [];

        if (options.suites) {
            if (!checkArrayMaxItems(options.suites)) {
                console.error(`Too many suites defined: Maximum allowed is ${MAX_ITEMS}`);
                throw new TestRunnerError(`Too many suites defined: Maximum allowed is ${MAX_ITEMS}`);
            }

            for (let i = 0; i < options.suites.length; i++) {
                options.suites[i].index = i;
                const suite = new Suite(options.suites[i]);
                this.#suites.push(suite);
            }
        }
    }

    async initFunctions(options) {
        console.log('Init functions...');
        this.#functions = [];

        if (options.functions) {
            if (!checkArrayMaxItems(options.functions)) {
                console.error(`Too many functions defined: Maximum allowed is ${MAX_ITEMS}`);
                throw new TestRunnerError(`Too many functions defined: Maximum allowed is ${MAX_ITEMS}`);
            }

            for (let i = 0; i < options.functions.length; i++) {
                const func = new TRFunction(options.functions[i]);
                this.#functions.push(func);
            }
        }
    }

    async initApis(options) {
        console.log('Init APIs...');
        this.#apis = [];

        if (!checkArrayMaxItems(options.apis)) {
            console.error(`Too many APIs defined: Maximum allowed is ${MAX_ITEMS}`);
            throw new TestRunnerError(`Too many APIs defined: Maximum allowed is ${MAX_ITEMS}`);
        }

        if (options.apis) {
            for (let i = 0; i < options.apis.length; i++) {
                const api = new TRApi(options.apis[i]);
                this.#apis.push(api);
            }
        }
    }

    async initSessions() {
        console.log('Init sessions...');
        this.#sessions = runConfigurationFactory(this.#runConfiguration);

        if (!this.#sessions || this.#sessions.length === 0) {
            console.error('No sessions found');
            throw new TestRunnerError('No sessions found');
        }

        this.startSessionsPinger();
    }

    startSessionsPinger() {
        console.log('Starting sessions pinger...');
        this.#sessionPinger = new SessionPinger(this.#sessions);
        this.#sessionPinger.start();
    }

    stopSessionsPinger() {
        console.log('Stopping sessions pinger...');
        this.#sessionPinger.stop();
    }

    async startSession(runType, sessionName) {
        console.log(`Starting session for type ${runType}...`);

        const runSession = this.getSession(runType);
        if (!runSession) {
            throw new TestRunnerError(`No Existing session found for type: ${runType}`);
        }

        if (runType == 'api') {
            return runSession; // No session management for API runs
        }

        if (runSession.driver) {
            return runSession;
        } else if (runType == 'web') {
            if (TestRunner.#savedWebDriver) {
                console.log('Using saved web driver');
                runSession.driver = TestRunner.#savedWebDriver;
                return runSession;
            } else {
                console.log('No web saved driver found');
            }
        } else if (runType == 'mobile') {
            if (TestRunner.#savedMobileDriver) {
                console.log('Using saved mobile driver');
                runSession.driver = TestRunner.#savedMobileDriver;
                return runSession;
            } else {
                console.log('No mobile saved driver found');
            }
        }

        runSession.driver = await runSession.runConf.startSession(sessionName);
        if (!runSession.driver) {
            console.error(`Driver could not be set for session "${sessionName}" of type ${runType}`);
            throw new TestRunnerError(`Driver could not be set for session "${sessionName}" of type ${runType}`);
        }

        return runSession;
    }

    async closeSession(runSession) {
        console.log(`Closing session type ${runSession.type}...`);
        if (runSession.driver) {
            if (this.#runConfiguration.keepSession) {
                console.log('Saving driver...');
                if (runSession.type == 'web') {
                    TestRunner.#savedWebDriver = runSession.driver;
                } else if (runSession.type == 'mobile') {
                    TestRunner.#savedMobileDriver = runSession.driver;
                }
                // } else if (this.#runConfiguration.noFollowReset && runSession.type == 'mobile') {
                //     console.log('Mobile No follow reset flag set - skipping closing or resetting session');
            } else {
                try {
                    const thisSession = runSession.driver;
                    runSession.driver = null;
                    await thisSession.deleteSession();
                    console.log('Session closed successfully');
                } catch (error) {
                    console.error('Error closing session (could be already lost):', error);
                } finally {
                    if (runSession.type == 'web') {
                        TestRunner.#savedWebDriver = null;
                    } else if (runSession.type == 'mobile') {
                        TestRunner.#savedMobileDriver = null;
                    }
                }
            }
        }
    }

    async terminateAllSessions() {
        this.stopSessionsPinger();

        console.log('Terminating all sessions...');
        for (let i = 0; i < this.#sessions.length; i++) {
            await this.closeSession(this.#sessions[i]);
        }
    }

    async updateConfiguration() {
        console.log('Updating configuration...');

        // ... inside class
        for (const suite of this.#suites) {
            for (const test of suite.tests) {
                for (const step of test.steps) {
                    if (step.command === 'upload-file') {
                        try {
                            if (!step.valueUrl || !step.valueFilename) {
                                continue;
                            }
                            const url = step.valueUrl.replace('s3::', '');
                            const fileName = step.valueFilename;
                            const localPath = await downloadFile(url, fileName, true);
                            if (!localPath) {
                                console.error(`Failed to download file from ${test.name}`);
                                throw new TestRunnerError(`Failed to download file: ${test.name}`);
                            }
                            step.value = localPath;
                        } catch (error) {
                            console.error(`Failed to download file for step: ${error.message}`);
                            throw new TestRunnerError(`Failed to download file: ${error.message}`);
                        }
                    }
                }
            }
        }
    }

    async runSuite(suite) {
        console.log(`Starting suite ${suite.name} run...`);

        try {
            const suitePromises = await suite.run(this.#sessions, this.#functions, this.#apis, this.variables, this);
            const suiteResult = await suite.report();

            mergeVariables(this.#variables, suite.variables);

            console.log(`suite ${suite.name} run completed.`);

            return { promises: suitePromises, suiteResult: suiteResult };
        } catch (error) {
            console.error('Error running suite:', error);
            throw new Error(`error running suite: ${error.message}`);
        }
    }

    async run() {
        console.log('Starting run...');

        let promises = [];
        let suiteResults = [];

        try {
            await this.initSessions();

            await this.updateConfiguration();

            //const runName = `Run - ${new Date().toISOString()}`;

            for (let i = 0; i < this.#suites.length; i++) {
                console.log(
                    `TestRunner::Running suite #${i + 1} of type ${this.#suites[i].type} out of ${this.#suites.length}`
                );
                const suite = this.#suites[i];
                const suiteRunOutput = await this.runSuite(suite);
                console.log(`Adding videos promises for suite ${i + 1} to main promises`);
                promises = promises.concat(suiteRunOutput.promises);
                console.log(`Adding suite result for suite ${i + 1} to main results`);
                suiteResults.push(suiteRunOutput.suiteResult);

                try {
                    // closing sessions at end of suite
                    await this.terminateAllSessions();
                } catch (error) {
                    console.error(
                        `Error closing sessions for suite #${i + 1} - ${suite.name} - ${suite.type}: ${error} `
                    );
                    throw new Error(
                        `${new Date().toUTCString()} Error closing sessions for suite #${i + 1} - ${suite.name} - ${suite.type}: ${error}`
                    );
                }

                //Pause to let eventually sauce labs free sesssion in case new sessions are required
                const pauseTime = 4500;
                console.log(`TestRunner::Suite ${i + 1} completed, pausing app for ${pauseTime / 1000} seconds`);
                await pauseApp(pauseTime);
            }

            console.log('Suite run complete waiting for all video promises to complete');
            if (promises.length > 0) {
                await Promise.all(promises);
                console.log('All video promises completed');
            } else {
                console.log('No video promises found');
            }
        } catch (error) {
            if (error instanceof TestAbuseError) {
                throw error;
            } else {
                console.error('Error running:', error);
                throw new Error(`Error running test: ${error.message}`);
            }
        } finally {
            await this.terminateAllSessions();
        }

        return suiteResults;
    }
}

module.exports = TestRunner;
