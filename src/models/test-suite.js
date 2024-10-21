const { mergeVariables } = require('../helpers/utils');
const TestDefinition = require('./test-definition');

class TestSuite {
    #conf = null;
    #id = '';
    #name = '';
    #type = '';
    #waitBetweenTests = 0;
    #stopOnFailure = false;
    #variables = {};
    #tests = [];

    constructor(suite) {
        this.#id = suite.id ?? '';
        this.#name = suite.name ?? '';
        this.#type = suite.type ?? '';
        this.#waitBetweenTests = suite.waitBetweenTests ?? 0;
        this.#stopOnFailure = suite.stopOnFailure ?? false;
        this.#variables = suite.variables ?? {};
        this.#buildTests(suite.tests);
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

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get type() {
        return this.#type;
    }

    get tests() {
        return this.#tests;
    }

    get variables() {
        return this.#variables;
    }

    async run(driver, variables, conf) {
        const tests = this.#tests;

        mergeVariables(this.#variables, variables);

        for (let i = 0; i < tests.length; i++) {
            console.log(`TestSuite::Running test #${i} ${tests[i].name} in suite ${this.#name}`);
            const test = tests[i];
            if (test.skip) {
                continue;
            }

            await test.run(driver, this.variables, conf);
            if (this.#stopOnFailure && test.status === 'failed') {
                break;
            }

            mergeVariables(this.#variables, test.variables);

            if (this.#waitBetweenTests > 0) {
                await driver.pause(this.#waitBetweenTests);
            }
            console.log(`TestSuite::Finished test #${i}`);
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
                id: test.id,
                suiteId: this.#id,
                name: test.name,
                status: test.status,
                failedStep: {},
                error: ''
            };
            switch (test.status) {
                case 'passed':
                    passed++;
                    break;
                case 'failed':
                    failed++;
                    testDetail.failedStep = {
                        sequence: test.lastStep,
                        command: test.steps[test.lastStep].command,
                        target: test.steps[test.lastStep].usedSelector,
                        error: test.steps[test.lastStep].errorDetails,
                        url: ''
                    };
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
            id: this.#id,
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
