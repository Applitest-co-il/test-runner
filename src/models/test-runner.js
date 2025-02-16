const { TestRunnerError, TestDefinitionError, TestAbuseError } = require('../helpers/test-errors');
const Suite = require('./suite');
const { runConfigurationFactory } = require('./test-run-configuration');
const { mergeVariables } = require('../helpers/utils');
const SessionPinger = require('../helpers/session-pinger');

class TestRunner {
    static #savedWebDriver = null;

    #runConfiguration = null;
    #sessions = [];
    #sessionPinger = null;

    #suites = [];
    #variables = {};

    constructor(options) {
        this.#runConfiguration = options.runConfiguration;
        this.#variables = options.variables ?? {};

        if (options.suites) {
            for (let i = 0; i < options.suites.length; i++) {
                options.suites[i].index = i;
                const suite = new Suite(options.suites[i]);
                this.#suites.push(suite);
            }
        }

        if (this.#suites.length === 0) {
            console.error('No suites found');
            throw new TestDefinitionError('No suites found');
        }

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

    getSession(type) {
        return this.#sessions.find((session) => session.type === type);
    }

    async initSessions() {
        console.log('Init sessions...');

        this.#sessions = runConfigurationFactory(this.#runConfiguration);

        for (const session of this.#sessions) {
            await this.startSession(session.type);
        }

        this.#sessionPinger = new SessionPinger(this.#sessions);
        this.#sessionPinger.start();
    }

    async startSession(runType) {
        console.log(`Starting session for type ${runType}...`);

        const runSession = this.getSession(runType);
        if (!runSession) {
            throw new TestRunnerError(`No Existing session found for type: ${runType}`);
        }

        if (runSession.driver) {
            return runSession;
        } else if (runType == 'web') {
            if (TestRunner.#savedWebDriver) {
                console.log('Using saved driver');
                runSession.driver = TestRunner.#savedWebDriver;
                return runSession;
            } else {
                console.log('No web saved driver found');
            }
        }

        runSession.driver = await runSession.runConf.startSession();
        if (!runSession.driver) {
            console.error('Driver could not be set');
            throw new TestRunnerError('Driver could not be set');
        }

        return runSession;
    }

    async closeSession(runSession) {
        console.log(`Closing session type ${runSession.type}...`);
        if (runSession.driver) {
            if (this.#runConfiguration.keepSession) {
                console.log('Saving driver...');
                TestRunner.#savedWebDriver = runSession.driver;
                // } else if (this.#runConfiguration.noFollowReset && runSession.type == 'mobile') {
                //     console.log('Mobile No follow reset flag set - skipping closing or resetting session');
            } else {
                console.log('Closing session...');
                try {
                    await runSession.driver.deleteSession();
                    runSession.driver = null;
                } catch (error) {
                    console.error('Error closing session (could be already lost):', error);
                } finally {
                    if (runSession.type == 'web') {
                        TestRunner.#savedWebDriver = null;
                    }
                }
            }
        }
    }

    async terminateAllSessions() {
        console.log('Terminating all sessions...');
        if (this.#sessionPinger) {
            await this.#sessionPinger.stop();
        }
        for (let i = 0; i < this.#sessions.length; i++) {
            await this.closeSession(this.#sessions[i]);
        }
    }

    async run() {
        console.log('Starting run...');

        let promises = [];
        let suiteResults = [];

        try {
            await this.initSessions();

            for (let i = 0; i < this.#suites.length; i++) {
                console.log(
                    `TestRunner::Running suite #${i} of type ${this.#suites[i].type} out of ${this.#suites.length}`
                );
                const suite = this.#suites[i];

                try {
                    const suitePromises = await suite.run(this.#sessions, this.variables);

                    console.log(`Adding videos promises for suite ${i} to main promises`);
                    promises = promises.concat(suitePromises);

                    mergeVariables(this.#variables, suite.variables);

                    let suiteResult = await suite.report();
                    suiteResults.push(suiteResult);

                    console.log(`TestRunner::Suite ${i} run complete`);
                } catch (error) {
                    if (error instanceof TestAbuseError) {
                        throw error;
                    } else {
                        console.error('Error running suite:', error);
                        throw new Error(`error running suite: ${error.message}`);
                    }
                }
            }

            console.log('Test run complete waiting for all video promises to complete');
            if (promises.length > 0) {
                await Promise.all(promises);
                console.log('All video promises completed');
            } else {
                console.log('No video promises found');
            }
        } catch (error) {
            console.error('Error running:', error);
            throw new Error(`error running test: ${error.message}`);
        } finally {
            await this.terminateAllSessions();
        }

        return suiteResults;
    }
}

module.exports = TestRunner;
