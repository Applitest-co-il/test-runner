const { TestRunnerError, TestDefinitionError, TestAbuseError } = require('../helpers/test-errors');
const Suite = require('./suite');
const { runConfigurationFactory } = require('./test-run-configuration');
const { mergeVariables } = require('../helpers/utils');

class TestRunner {
    static #savedDriver = null;

    #runConfiguration = null;
    #driver = null;

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

    get variables() {
        return this.#variables;
    }

    async startSession(runType) {
        console.log('Starting session...');

        const runConf = runConfigurationFactory(this.#runConfiguration, runType);

        if (this.#driver) {
            return runConf;
        } else if (runType == 'web' && TestRunner.#savedDriver) {
            console.log('Using saved driver');
            this.#driver = TestRunner.#savedDriver;
            return runConf;
        } else if (TestRunner.#savedDriver) {
            console.log('Closing session...');
            await TestRunner.#savedDriver.deleteSession();
            TestRunner.#savedDriver = null;
        } else {
            console.log('No saved driver found');
        }

        this.#driver = await runConf.startSession();
        if (!this.#driver) {
            console.error('Driver could not be set');
            throw new TestRunnerError('Driver could not be set');
        }

        return runConf;
    }

    async closeSession(forceEndSession = false) {
        if (this.#driver) {
            if (this.#runConfiguration.keepSession) {
                console.log('Saving driver...');
                TestRunner.#savedDriver = this.#driver;
            } else if (!forceEndSession && this.#runConfiguration.noFollowReset) {
                console.log('Mobile No follow reset flag set - skipping closing or resetting session');
            } else {
                console.log('Closing session...');
                try {
                    await this.#driver.deleteSession();
                    this.#driver = null;
                } catch (error) {
                    console.error('Error closing session (could be already lost):', error);
                }
                TestRunner.#savedDriver = null;
            }
        }
    }

    async run() {
        try {
            console.log('Starting run...');

            let promises = [];
            let suiteResults = [];
            let currentRunType = this.#suites.length ? this.#suites[0].type : '';

            for (let i = 0; i < this.#suites.length; i++) {
                console.log(
                    `TestRunner::Running suite #${i} of type ${this.#suites[i].type} out of ${this.#suites.length}`
                );
                const suite = this.#suites[i];

                if (currentRunType !== suite.type) {
                    currentRunType = suite.type;
                }

                try {
                    const runConf = await this.startSession(suite.type);

                    const suitePromises = await suite.run(this.#driver, this.variables, runConf);

                    console.log(`Adding videos promises for suite ${i} to main promises`);
                    promises = promises.concat(suitePromises);

                    mergeVariables(this.#variables, suite.variables);

                    let suiteResult = await suite.report();
                    suiteResults.push(suiteResult);

                    const forceEndSession = i == this.#suites.length - 1 || this.#suites[i + 1].type != currentRunType;
                    await this.closeSession(forceEndSession);
                    console.log(`TestRunner::Suite ${i} run complete`);
                } catch (error) {
                    await this.closeSession(true);
                    if (error instanceof TestAbuseError) {
                        throw error;
                    } else {
                        console.error('Error running suite:', error);
                        throw new Error(`error running suite: ${error.message}`);
                    }
                }
            }

            console.log('Test run complete waiting for all video promises to complete');
            await Promise.all(promises);
            console.log('All video promises completed');

            return suiteResults;
        } catch (error) {
            if (error instanceof TestAbuseError) {
                throw error;
            } else {
                console.error('Error running test:', error);
            }
        }
        return null;
    }
}

module.exports = TestRunner;
