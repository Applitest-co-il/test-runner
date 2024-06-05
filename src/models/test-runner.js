const { TestRunnerError } = require('../helpers/test-errors');
const TestSuite = require('./test-suite');
const { RunConfiguration } = require('./test-run-configuration');

class TestRunner {
    #conf = null;
    #driver = null;

    #suites = [];
    #variables = {};

    constructor(options) {
        this.#conf = RunConfiguration.factory(options.runConfiguration);
        this.#variables = options.variables ?? {};

        if (options.suites) {
            for (let i = 0; i < options.suites.length; i++) {
                const suite = new TestSuite(options.suites[i]);
                this.#suites.push(suite);
            }
        }
    }

    async startSession() {
        console.log('Starting session...');
        this.#driver = await this.#conf.startSession();
        if (!this.#driver) {
            console.error('Driver could not be set');
            throw new TestRunnerError('Driver could not be set');
        }
    }

    async closeSession() {
        if (this.#driver) {
            console.log('Closing session...');
            await this.#conf.closeSession(this.#driver);
        }
    }

    async run() {
        try {
            console.log('Starting run...');

            await this.startSession();

            let suiteResults = [];
            for (let i = 0; i < this.#suites.length; i++) {
                const suite = this.#suites[i];
                await suite.run(this.#driver, this.#variables);
                let suiteResult = await suite.report();
                suiteResults.push(suiteResult);
            }

            await this.closeSession();

            console.log('Test run complete');

            let outputResult = true;
            for (let i = 0; i < suiteResults.length; i++) {
                outputResult &= suiteResults[i].success;
            }

            return outputResult;
        } catch (error) {
            console.error('Error running test:', error);
        }
        return false;
    }
}

module.exports = TestRunner;
