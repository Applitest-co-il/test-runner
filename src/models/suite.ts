import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { mergeVariables } from '../helpers/utils';
import { Test } from './test';
import { TestConfiguration, SuiteResult, RunSession, TestDetail } from '../types';
import { TrFunction } from './function';
import { TestRunner } from './test-runner';
import { TrApi } from './api';

interface SuiteConstructorData {
    id?: string;
    name?: string;
    index?: number;
    type?: string;
    waitBetweenTests?: number;
    stopOnFailure?: boolean;
    variables?: Record<string, any>;
    tests?: TestConfiguration[];
}

export class Suite {
    private readonly _id: string = '';
    private readonly _name: string = '';
    private readonly _index: number = -1;
    private readonly _type: string = '';
    private readonly _waitBetweenTests: number = 0;
    private readonly _stopOnFailure: boolean = false;
    private readonly _variables: Record<string, any> = {};
    private readonly _tests: Test[] = [];

    constructor(suite: SuiteConstructorData, index: number) {
        this._id = suite.id ?? '';
        this._name = suite.name ?? '';
        this._index = index;
        this._type = suite.type ?? '';
        this._waitBetweenTests = suite.waitBetweenTests ?? 0;
        this._stopOnFailure = suite.stopOnFailure ?? false;
        this._variables = suite.variables ?? {};
        this.buildTests(suite.tests || []);
    }

    private buildTests(tests: TestConfiguration[]): void {
        if (!checkArrayMaxItems(tests)) {
            console.error(`Too many tests in suite "${this._id} - ${this._name}": Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        if (tests.length === 0) {
            console.error(`No tests found in suite "${this._id} - ${this._name}"`);
            return;
        }

        for (let i = 0; i < tests.length; i++) {
            const testDefinition = tests[i];
            const testWithIndex = {
                ...testDefinition,
                suiteIndex: this._index,
                index: i
            };
            let test = new Test(testWithIndex);
            this._tests.push(test);
        }
    }

    //#region Getters

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get index(): number {
        return this._index;
    }

    get type(): string {
        return this._type;
    }

    get waitBetweenTests(): number {
        return this._waitBetweenTests;
    }

    get stopOnFailure(): boolean {
        return this._stopOnFailure;
    }

    get variables(): Record<string, any> {
        return this._variables;
    }

    get tests(): Test[] {
        return this._tests;
    }

    //#endregion

    async run(
        sessions: RunSession[],
        functions: TrFunction[],
        apis: TrApi[],
        variables: Record<string, string>,
        testRunner: TestRunner
    ): Promise<Promise<void>[]> {
        let promises: Promise<void>[] = [];

        const tests = this._tests;

        mergeVariables(this._variables, variables);

        for (let i = 0; i < tests.length; i++) {
            console.log(`TestSuite::Running test #${i + 1} ${tests[i].name} in suite ${this._name}`);
            const test = tests[i];
            if (test.skip) {
                continue;
            }

            const runType = test.type.startsWith('mobile') ? 'mobile' : test.type;
            const runSession = sessions.find((session) => session.type === runType);
            const sessionName = `Session suite # ${this._index + 1} - ${runType}`;
            if (!runSession || !runSession.driver) {
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

            // Get the session after potentially starting it
            const currentSession = sessions.find((session) => session.type === runType);
            if (!currentSession) {
                throw new Error(`Failed to obtain session for run type: ${runType}`);
            }

            const testPromises = await test.run(currentSession, functions, apis, this._variables);

            console.log(`Adding video promise "${this._index}_${i}" to suite promises`);
            promises = promises.concat(testPromises);

            if (this._stopOnFailure && test.status === 'failed') {
                break;
            }

            mergeVariables(this._variables, test.variables);

            if (this._waitBetweenTests > 0 && runSession?.driver) {
                await runSession.driver.pause(this._waitBetweenTests);
            }
            console.log(`TestSuite::Finished test #${i + 1}`);
        }

        return promises;
    }

    report(): SuiteResult {
        console.log('\n===============');
        console.log(`Test suite: ${this._name}`);
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let pending = 0;
        let errors: string[] = [];
        let testDetails: TestDetail[] = [];

        for (let i = 0; i < this._tests.length; i++) {
            const test = this._tests[i] as any;

            let testDetail: TestDetail = {
                id: test.id,
                suiteId: this._id,
                suiteIdx: this._index,
                suiteName: this._name,
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
        console.log(`Errors: ${errors.length === 0 ? 'None' : ''}`);
        for (let i = 0; i < errors.length; i++) {
            console.error(`- ${errors[i]}`);
        }
        console.log('===============\n');

        const output: SuiteResult = {
            id: this._id,
            name: this._name,
            index: this._index,
            success: failed === 0 && pending === 0,
            summary: {
                total: this._tests.length,
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
