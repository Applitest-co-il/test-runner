const { mergeVariables } = require('../helpers/utils');
const { TestRunnerError } = require('../helpers/test-errors');
const Test = require('./test');

class Suite {
    #id = '';
    #name = '';
    #index = -1;
    #type = '';
    #waitBetweenTests = 0;
    #stopOnFailure = false;
    #variables = {};
    #tests = [];

    constructor(suite) {
        this.#id = suite.id ?? '';
        this.#name = suite.name ?? '';
        this.#index = suite.index ?? -1;
        this.#type = suite.type ?? '';
        this.#waitBetweenTests = suite.waitBetweenTests ?? 0;
        this.#stopOnFailure = suite.stopOnFailure ?? false;
        this.#variables = suite.variables ?? {};
        this.#buildTests(suite.tests);
    }

    #buildTests(tests) {
        if (!tests || tests.length === 0) {
            console.error(`No tests found in suite "${this.#id} - ${this.#name}"`);
            return;
        }

        for (let i = 0; i < tests.length; i++) {
            const testDefinition = tests[i];
            testDefinition.suiteIndex = this.#index;
            testDefinition.index = i;
            let test = new Test(testDefinition);
            this.#tests.push(test);
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

    async run(sessions, functions, apis, variables, testRunner) {
        let promises = [];

        const tests = this.#tests;

        mergeVariables(this.#variables, variables);

        for (let i = 0; i < tests.length; i++) {
            console.log(`TestSuite::Running test #${i + 1} ${tests[i].name} in suite ${this.#name}`);
            const test = tests[i];
            if (test.skip) {
                continue;
            }

            const runType = test.type.startsWith('mobile') ? 'mobile' : test.type;
            const runSession = sessions.find((session) => session.type === runType);
            const sessionName = `Session suite # ${this.#index + 1} - ${runType}`;
            if (!runSession || !runSession.driver) {
                // console.error(`No session found for test ${test.id} - ${test.name} - ${test.type}`);
                // throw new TestRunnerError(`No session found for test ${test.id} - ${test.name} - ${test.type}`);
                console.log(`Starting session: ${sessionName}`);
                if (runType === 'web') {
                    await testRunner.startSession('web', sessionName);
                } else if (runType.startsWith('mobile')) {
                    await testRunner.startSession('mobile', sessionName);
                }
                console.log(`Session ${sessionName} started successfully`);
            } else {
                console.log(`Session ${sessionName} is already running`);
            }

            const testPromises = await test.run(runSession, functions, apis, this.variables);

            console.log(`Adding video promise "${this.#index}_${i}" to suite promises`);
            promises = promises.concat(testPromises);

            if (this.#stopOnFailure && test.status === 'failed') {
                break;
            }

            mergeVariables(this.#variables, test.variables);

            if (this.#waitBetweenTests > 0) {
                await runSession.driver.pause(this.#waitBetweenTests);
            }
            console.log(`TestSuite::Finished test #${i + 1}`);
        }

        return promises;
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
                suiteIdx: this.#index,
                suiteName: this.#name,
                index: test.index,
                type: test.type,
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
                        target: test.steps[test.lastStep].usedSelectors,
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
            index: this.#index,
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

module.exports = Suite;
