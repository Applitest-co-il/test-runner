const { mergeVariables } = require('../helpers/utils');
const TestDefinition = require('./test-definition');

class TestSuite {
    #name = '';
    #waitBetweenTests = 0;
    #stopOnFailure = false;
    #variables = {};
    #tests = [];

    constructor(options) {
        this.#name = options.name;
        this.#waitBetweenTests = options.waitBetweenTests ?? 0;
        this.#stopOnFailure = options.stopOnFailure ?? false;
        this.#variables = options.variables ?? {};
        this.#buildTests(options.tests);
    }

    #buildTests(tests) {
        if (!tests || tests.length === 0) {
            console.error('No tests found');
            return;
        }

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            let testDefinition = new TestDefinition(test);
            this.#tests.push(testDefinition);
        }
    }

    get name() {
        return this.#name;
    }

    get tests() {
        return this.#tests;
    }

    async run(driver, variables) {
        const tests = this.#tests;

        mergeVariables(this.#variables, variables);

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            if (test.skip) {
                continue;
            }

            await test.run(driver, this.#variables);
            if (this.#stopOnFailure && test.status === 'failed') {
                break;
            }
            if (this.#waitBetweenTests > 0) {
                await driver.pause(this.#waitBetweenTests);
            }
        }
    }

    report() {
        console.log('\n===============');
        console.log(`Test suite: ${this.#name}`);
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let pending = 0;
        let errors = [];
        let testDetails = [];

        for (let i = 0; i < this.#tests.length; i++) {
            const test = this.#tests[i];

            let testDetail = {
                name: test.name,
                status: test.status,
                failedStep: 0,
                error: ''
            };
            switch (test.status) {
                case 'passed':
                    passed++;
                    break;
                case 'failed':
                    failed++;
                    errors.push(
                        `Test ${i + 1} "${test.name}" - fail in step ${test.lastStep + 1} with error "${test.errorDetails}"`
                    );
                    testDetail.failedStep = test.lastStep;
                    testDetail.error = test.errorDetails;
                    break;
                case 'pending':
                    pending++;
                    break;
                default:
                    skipped++;
                    break;
            }
            testDetails.push(testDetail);
        }
        console.log('===============\n\n');
        console.log(`Passed: ${passed}\nFailed: ${failed}\nSkipped: ${skipped}\nPending: ${pending}`);
        console.log(`Errors: ${errors.length == 0 ? 'None' : ''}`);
        for (let i = 0; i < errors.length; i++) {
            console.error(`- ${errors[i]}`);
        }
        console.log('===============\n');

        const output = {
            name: this.#name,
            success: failed === 0 && pending === 0,
            summary: {
                total: this.#tests.length,
                passed: passed,
                failed: failed,
                skipped: skipped,
                pending: pending
            },
            details: testDetails
        };
        return output;
    }
}

module.exports = TestSuite;
