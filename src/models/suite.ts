import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { mergeVariables } from '../helpers/utils';
import { Test } from './test';
import { TestConfiguration, SessionConfiguration } from '../types';

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

interface SuiteReport {
    id: string;
    name: string;
    index: number;
    success: boolean;
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        pending: number;
    };
    details: TestDetail[];
}

interface TestDetail {
    id: string;
    suiteId: string;
    suiteIdx: number;
    suiteName: string;
    index: number;
    type: string;
    name: string;
    status: string;
    failedStep: FailedStepDetail;
    error: string;
}

interface FailedStepDetail {
    sequence?: number;
    command?: string;
    target?: any;
    error?: string;
    url?: string;
}

export class Suite {
    private readonly id: string = '';
    private readonly name: string = '';
    private readonly index: number = -1;
    private readonly type: string = '';
    private readonly waitBetweenTests: number = 0;
    private readonly stopOnFailure: boolean = false;
    private readonly variables: Record<string, any> = {};
    private readonly tests: Test[] = [];

    constructor(suite: SuiteConstructorData) {
        this.id = suite.id ?? '';
        this.name = suite.name ?? '';
        this.index = suite.index ?? -1;
        this.type = suite.type ?? '';
        this.waitBetweenTests = suite.waitBetweenTests ?? 0;
        this.stopOnFailure = suite.stopOnFailure ?? false;
        this.variables = suite.variables ?? {};
        this.buildTests(suite.tests || []);
    }

    private buildTests(tests: TestConfiguration[]): void {
        if (!checkArrayMaxItems(tests)) {
            console.error(`Too many tests in suite "${this.id} - ${this.name}": Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        if (tests.length === 0) {
            console.error(`No tests found in suite "${this.id} - ${this.name}"`);
            return;
        }

        for (let i = 0; i < tests.length; i++) {
            const testDefinition = tests[i];
            const testWithIndex = {
                ...testDefinition,
                suiteIndex: this.index,
                index: i
            };
            let test = new Test(testWithIndex);
            this.tests.push(test);
        }
    }

    get getId(): string {
        return this.id;
    }

    get getName(): string {
        return this.name;
    }

    get getType(): string {
        return this.type;
    }

    get getTests(): Test[] {
        return this.tests;
    }

    get getVariables(): Record<string, any> {
        return this.variables;
    }

    async run(
        sessions: SessionConfiguration[],
        functions: Record<string, any>,
        apis: Record<string, any>,
        variables: Record<string, any>,
        testRunner: any
    ): Promise<Promise<void>[]> {
        let promises: Promise<void>[] = [];

        const tests = this.tests;

        mergeVariables(this.variables, variables);

        for (let i = 0; i < tests.length; i++) {
            console.log(`TestSuite::Running test #${i + 1} ${(tests[i] as any).name} in suite ${this.name}`);
            const test = tests[i];
            if ((test as any).skip) {
                continue;
            }

            const runType = (test as any).type.startsWith('mobile') ? 'mobile' : (test as any).type;
            const runSession = sessions.find((session) => session.runType === runType);
            const sessionName = `Session suite # ${this.index + 1} - ${runType}`;
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
            const currentSession = sessions.find((session) => session.runType === runType);
            if (!currentSession) {
                throw new Error(`Failed to obtain session for run type: ${runType}`);
            }

            const testPromises = await test.run(currentSession, functions, apis, this.variables);

            console.log(`Adding video promise "${this.index}_${i}" to suite promises`);
            promises = promises.concat(testPromises);

            if (this.stopOnFailure && (test as any).status === 'failed') {
                break;
            }

            mergeVariables(this.variables, (test as any).variables);

            if (this.waitBetweenTests > 0 && runSession?.driver) {
                await runSession.driver.pause(this.waitBetweenTests);
            }
            console.log(`TestSuite::Finished test #${i + 1}`);
        }

        return promises;
    }

    report(): SuiteReport {
        console.log('\n===============');
        console.log(`Test suite: ${this.name}`);
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let pending = 0;
        let errors: string[] = [];
        let testDetails: TestDetail[] = [];

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i] as any;

            let testDetail: TestDetail = {
                id: test.id,
                suiteId: this.id,
                suiteIdx: this.index,
                suiteName: this.name,
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

        const output: SuiteReport = {
            id: this.id,
            name: this.name,
            index: this.index,
            success: failed === 0 && pending === 0,
            summary: {
                total: this.tests.length,
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
