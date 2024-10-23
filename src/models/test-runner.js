const { TestRunnerError, TestDefinitionError } = require('../helpers/test-errors');
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

        if (runType == 'web' && TestRunner.#savedDriver) {
            console.log('Using saved driver');
            this.#driver = TestRunner.#savedDriver;
            return;
        } else if (TestRunner.#savedDriver) {
            console.log('Closing session...');
            await TestRunner.#savedDriver.deleteSession();
            TestRunner.#savedDriver = null;
        } else {
            console.log('No saved driver found');
        }

        const runConf = runConfigurationFactory(this.#runConfiguration, runType);
        this.#driver = await runConf.startSession();
        if (!this.#driver) {
            console.error('Driver could not be set');
            throw new TestRunnerError('Driver could not be set');
        }

        return runConf;
    }

    async closeSession() {
        if (this.#driver) {
            if (this.#runConfiguration.keepSession) {
                console.log('Saving driver...');
                TestRunner.#savedDriver = this.#driver;
            } else {
                console.log('Closing session...');
                await this.#driver.deleteSession();
                TestRunner.#savedDriver = null;
            }
        }
    }

    async run() {
        try {
            console.log('Starting run...');

            let promises = [];
            let suiteResults = [];

            for (let i = 0; i < this.#suites.length; i++) {
                console.log(`TestRunner::Running suite #${i} out of ${this.#suites.length}`);
                const suite = this.#suites[i];

                const runConf = await this.startSession(suite.type);

                const suitePromises = await suite.run(this.#driver, this.variables, runConf);
                promises = promises.concat(suitePromises);

                mergeVariables(this.#variables, suite.variables);

                let suiteResult = await suite.report();
                suiteResults.push(suiteResult);

                await this.closeSession();
                console.log(`TestRunner::Suite ${i} run complete`);
            }

            console.log('Test run complete');
            await Promise.all(promises);
            return suiteResults;
        } catch (error) {
            console.error('Error running test:', error);
        }
        return false;
    }
}

module.exports = TestRunner;
