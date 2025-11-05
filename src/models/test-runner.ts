import { TestRunnerError, TestAbuseError } from '../helpers/test-errors';
import { Suite } from './suite';
import { TrFunction } from './function';
import { TrApi } from './api';
import { runConfigurationFactory } from './test-run-configuration';
import { mergeVariables, pauseApp } from '../helpers/utils';
import { SessionPinger } from '../helpers/session-pinger';
import { downloadFile } from '../helpers/download-file';
import { checkArrayMaxItems } from '../helpers/security';
import { TestRunConfiguration, SessionConfiguration, TestResult, TestSummary } from '../types';

const MAX_ITEMS = 1000;

interface TestRunnerOptions {
    runConfiguration?: any;
    variables?: Record<string, any>;
    suites?: any[];
    functions?: any[];
    apis?: any[];
}

export class TestRunner {
    private static savedWebDriver: any = null;
    private static savedMobileDriver: any = null;

    private runConfiguration: any = null;
    private sessions: any[] = [];
    private sessionPinger: SessionPinger | null = null;
    private suites: Suite[] = [];
    private functions: TrFunction[] = [];
    private apis: TrApi[] = [];
    private variables: Record<string, any> = {};

    constructor(options: TestRunnerOptions) {
        this.runConfiguration = options.runConfiguration;
        this.variables = options.variables ?? {};

        this.initSuites(options);
        this.initFunctions(options);
        this.initApis(options);

        if (
            this.suites.length > 1 &&
            (this.runConfiguration?.startFromStep > 0 ||
                this.runConfiguration?.stopAtStep > 0 ||
                this.runConfiguration?.keepSession)
        ) {
            console.log('Multiple suites found - startFromStep, stopAtStep and keepSession will be ignored');
            this.runConfiguration.startFromStep = -1;
            this.runConfiguration.stopAtStep = -1;
            this.runConfiguration.keepSession = false;
        }
    }

    get getSessions(): any[] {
        return this.sessions;
    }

    get getVariables(): Record<string, any> {
        return this.variables;
    }

    private initSuites(options: TestRunnerOptions): void {
        if (!options.suites || !checkArrayMaxItems(options.suites)) {
            console.error(`Too many suites: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < options.suites.length; i++) {
            const suiteData = options.suites[i];
            suiteData.index = i;
            const suite = new Suite(suiteData);
            this.suites.push(suite);
        }
    }

    private initFunctions(options: TestRunnerOptions): void {
        if (!options.functions || !checkArrayMaxItems(options.functions)) {
            console.error(`Too many functions: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < options.functions.length; i++) {
            const functionData = options.functions[i];
            const func = new TrFunction(functionData);
            this.functions.push(func);
        }
    }

    private initApis(options: TestRunnerOptions): void {
        if (!options.apis || !checkArrayMaxItems(options.apis)) {
            console.error(`Too many APIs: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < options.apis.length; i++) {
            const apiData = options.apis[i];
            const api = new TrApi(apiData);
            this.apis.push(api);
        }
    }

    async startSession(sessionType: string, sessionName: string): Promise<void> {
        console.log(`Starting ${sessionType} session: ${sessionName}`);

        const session = this.sessions.find((s) => s.runType === sessionType);
        if (!session) {
            throw new TestRunnerError(`No configuration found for session type: ${sessionType}`);
        }

        try {
            if (sessionType === 'web' && TestRunner.savedWebDriver && this.runConfiguration?.keepSession) {
                session.driver = TestRunner.savedWebDriver;
            } else if (sessionType === 'mobile' && TestRunner.savedMobileDriver && this.runConfiguration?.keepSession) {
                session.driver = TestRunner.savedMobileDriver;
            } else {
                session.driver = await (session as any).runConf.startSession(sessionName);

                if (sessionType === 'web') {
                    TestRunner.savedWebDriver = session.driver;
                } else if (sessionType === 'mobile') {
                    TestRunner.savedMobileDriver = session.driver;
                }
            }
        } catch (error) {
            console.error(`Failed to start ${sessionType} session:`, error);
            throw error;
        }
    }

    async run(): Promise<TestResult> {
        const runStartTime = Date.now();
        let runCompleted = false;
        let success = true;

        try {
            this.sessions = runConfigurationFactory(this.runConfiguration);

            if (this.sessions.length > 1) {
                this.sessionPinger = new SessionPinger(this.sessions, 60000);
                this.sessionPinger.start();
            }

            console.log(`Test run started with ${this.suites.length} suite(s)`);

            const suiteResults: any[] = [];
            const promises: Promise<void>[] = [];

            for (let i = 0; i < this.suites.length; i++) {
                const suite = this.suites[i];
                const functionsMap = this.getFunctionsMap();
                const apisMap = this.getApisMap();

                const suitePromises = await suite.run(this.sessions, functionsMap, apisMap, this.variables, this);
                promises.push(...suitePromises);

                const suiteResult = suite.report();
                suiteResults.push(suiteResult);

                if (!suiteResult.success) {
                    success = false;
                }
            }

            await Promise.all(promises);
            runCompleted = true;

            const summary = this.calculateSummary(suiteResults);
            const executionTime = Date.now() - runStartTime;

            return {
                runCompleted,
                success,
                executionTime,
                summary,
                suiteResults
            };
        } catch (error) {
            console.error('Test run failed:', error);
            success = false;

            return {
                runCompleted: false,
                success: false,
                executionTime: Date.now() - runStartTime,
                summary: { total: 0, passed: 0, failed: 0, skipped: 0, pending: 0 },
                suiteResults: []
            };
        } finally {
            if (this.sessionPinger) {
                await this.sessionPinger.stop();
            }

            if (!this.runConfiguration?.keepSession) {
                await this.closeSessions();
            }
        }
    }

    private getFunctionsMap(): Record<string, TrFunction> {
        const functionsMap: Record<string, TrFunction> = {};
        for (const func of this.functions) {
            functionsMap[func.getId] = func;
        }
        return functionsMap;
    }

    private getApisMap(): Record<string, TrApi> {
        const apisMap: Record<string, TrApi> = {};
        for (const api of this.apis) {
            apisMap[api.getId] = api;
        }
        return apisMap;
    }

    private calculateSummary(suiteResults: any[]): TestSummary {
        let total = 0,
            passed = 0,
            failed = 0,
            skipped = 0,
            pending = 0;

        for (const suiteResult of suiteResults) {
            total += suiteResult.summary.total;
            passed += suiteResult.summary.passed;
            failed += suiteResult.summary.failed;
            skipped += suiteResult.summary.skipped;
            pending += suiteResult.summary.pending;
        }

        return { total, passed, failed, skipped, pending };
    }

    private async closeSessions(): Promise<void> {
        for (const session of this.sessions) {
            if (session.driver) {
                try {
                    await session.driver.deleteSession();
                } catch (error) {
                    console.error('Error closing session:', error);
                }
            }
        }
    }
}
