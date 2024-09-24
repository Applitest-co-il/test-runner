const { TestRunnerError, TestDefinitionError } = require('../helpers/test-errors');
const Suite = require('./suite');
const { RunConfiguration } = require('./test-run-configuration');
const { mergeVariables } = require('../helpers/utils');

class TestRunner {
    static #savedDriver = null;

    #conf = null;
    #driver = null;

    #suites = [];
    #variables = {};

    constructor(options) {
        this.#conf = RunConfiguration.factory(options.runConfiguration);
        this.#variables = options.variables ?? {};

        if (options.suites) {
            for (let i = 0; i < options.suites.length; i++) {
                const suite = new Suite(options.suites[i], this.#conf);
                this.#suites.push(suite);
            }
        }

        if (this.#suites.length === 0) {
            console.error('No suites found');
            throw new TestDefinitionError('No suites found');
        }

        if (
            this.#suites.length > 1 &&
            (this.#conf.startFromStep > 0 || this.#conf.stopAtStep > 0 || this.#conf.keepSession)
        ) {
            console.log('Multiple suites found - startFromStep, stopAtStep and keepSession will be ignored');
            this.#conf.startFromStep = -1;
            this.#conf.stopAtStep = -1;
            this.#conf.keepSession = false;
        }
    }

    get variables() {
        return this.#variables;
    }

    async startSession() {
        console.log('Starting session...');
        if (TestRunner.#savedDriver) {
            console.log('Using saved driver');
            this.#driver = TestRunner.#savedDriver;
            return;
        }

        this.#driver = await this.#conf.startSession();
        if (!this.#driver) {
            console.error('Driver could not be set');
            throw new TestRunnerError('Driver could not be set');
        }
    }

    async closeSession() {
        if (this.#driver) {
            if (this.#conf.keepSession) {
                console.log('Saving driver...');
                TestRunner.#savedDriver = this.#driver;
            } else {
                console.log('Closing session...');
                await this.#conf.closeSession(this.#driver);
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
                await this.startSession();

                const suite = this.#suites[i];
                const suitePromises = await suite.run(this.#driver, this.variables);
                promises = promises.concat(suitePromises);

                mergeVariables(this.#variables, suite.variables);

                let suiteResult = await suite.report();
                suiteResults.push(suiteResult);

                await this.closeSession();
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
