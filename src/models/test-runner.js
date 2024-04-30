const { TestRunnerError } = require('../helpers/test-errors');
const TestSuite = require('./test-suite');
const { RunConfiguration } = require('./test-run-configuration');

class TestRunner {
    #conf = null;
    #suite = null;
    #driver = null;

    constructor(options) {
        this.#conf = RunConfiguration.factory(options.runConfiguration);
        this.#suite = new TestSuite(options.testSuite);
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

            await this.#suite.run(this.#driver);
            let suiteResult = await this.#suite.report();

            await this.closeSession();

            console.log('Test run complete');

            return suiteResult;
        } catch (error) {
            console.error('Error running test:', error);
        }
    }
}

module.exports = TestRunner;
