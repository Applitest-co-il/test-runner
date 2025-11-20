import { TestRunnerError } from '../helpers/test-errors';
import { Suite } from './suite';
import { TrFunction } from './function';
import { TrApi } from './api';
import { runConfigurationFactory } from './test-run-configuration';
import { SessionPinger } from '../helpers/session-pinger';
import { checkArrayMaxItems } from '../helpers/security';
import {
    RunConfiguration,
    RunResult,
    RunSession,
    RunSummary,
    SuiteResult,
    TestRunnerConfigurationError,
    TestRunnerOptions
} from '../types';
import UploadFileStep from './steps/upload-file-step';
import { downloadFile } from '../helpers/download-file';
import BaseStep from './steps/base-step';
import { mergeVariables } from '../helpers/utils';

const MAX_ITEMS = 1000;

export class TestRunner {
    private static savedWebDriver: any = null;
    private static savedMobileDriver: any = null;

    private _runConfiguration: RunConfiguration | undefined = undefined;
    private _sessions: RunSession[] = [];
    private _sessionPinger: SessionPinger | null = null;
    private _suites: Suite[] = [];
    private _functions: TrFunction[] = [];
    private _apis: TrApi[] = [];
    private _variables: Record<string, string> = {};

    constructor(options: TestRunnerOptions) {
        this._runConfiguration = options.runConfiguration;
        this._variables = options.variables ?? {};

        this.initSuites(options);
        this.initFunctions(options);
        this.initApis(options);

        if (this._suites.length > 1 && this.runConfiguration) {
            console.log('Multiple suites found - startFromStep, stopAtStep and keepSession will be ignored');
            this.runConfiguration.startFromStep = -1;
            this.runConfiguration.stopAtStep = -1;
            this.runConfiguration.keepSession = false;
        }
    }

    get runConfiguration(): RunConfiguration | undefined {
        return this._runConfiguration;
    }

    set runConfiguration(value: RunConfiguration | undefined) {
        this._runConfiguration = value;
    }

    get sessions(): RunSession[] {
        return this._sessions;
    }

    set sessions(value: RunSession[]) {
        this._sessions = value;
    }

    get sessionPinger(): SessionPinger | null {
        return this._sessionPinger;
    }

    set sessionPinger(value: SessionPinger | null) {
        this._sessionPinger = value;
    }

    get suites(): Suite[] {
        return this._suites;
    }

    set suites(value: Suite[]) {
        this._suites = value;
    }

    get functions(): TrFunction[] {
        return this._functions;
    }

    set functions(value: TrFunction[]) {
        this._functions = value;
    }

    get apis(): TrApi[] {
        return this._apis;
    }

    set apis(value: TrApi[]) {
        this._apis = value;
    }

    get variables(): Record<string, string> {
        return this._variables;
    }

    set variables(value: Record<string, string>) {
        this._variables = value;
    }

    public initSessions(): void {
        if (!this._runConfiguration) {
            console.error('Run configuration is not defined');
            throw new TestRunnerConfigurationError('Run configuration is not defined');
        }

        this._sessions = runConfigurationFactory(this._runConfiguration);

        if (!this._sessions || this._sessions.length === 0) {
            console.error('No sessions found');
            throw new TestRunnerConfigurationError('No sessions found');
        }

        if (this._sessions.length > 1) {
            this._sessionPinger = new SessionPinger(this._sessions, 60000);
            this._sessionPinger.start();
        }
    }

    public initSuites(options: TestRunnerOptions): void {
        if (!options.suites || !checkArrayMaxItems(options.suites)) {
            console.error(`Too many suites: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        this._suites = [];

        for (let i = 0; i < options.suites.length; i++) {
            const suiteData = options.suites[i];
            const suite = new Suite(suiteData, i);
            this._suites.push(suite);
        }
    }

    public initFunctions(options: TestRunnerOptions): void {
        if (!options.functions || !checkArrayMaxItems(options.functions)) {
            console.error(`Too many functions: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < options.functions.length; i++) {
            const functionData = options.functions[i];
            const func = new TrFunction(functionData);
            this._functions.push(func);
        }
    }

    public initApis(options: TestRunnerOptions): void {
        if (!options.apis || !checkArrayMaxItems(options.apis)) {
            console.error(`Too many APIs: Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < options.apis.length; i++) {
            const apiData = options.apis[i];
            const api = new TrApi(apiData);
            this._apis.push(api);
        }
    }

    private async updateDownloadFile(step: BaseStep, logName: string) {
        try {
            const uploadFileStep = step as UploadFileStep;
            if (!uploadFileStep.valueUrl || !uploadFileStep.valueFilename) {
                return;
            }
            const url = uploadFileStep.valueUrl.replace('s3::', '');
            const fileName = uploadFileStep.valueFilename;
            const localPath = await downloadFile(url, fileName, true);
            if (!localPath) {
                console.error(`Failed to download file from ${logName}`);
                throw new TestRunnerError(`Failed to download file: ${logName}`);
            }
            step.value = localPath;
        } catch (error: any) {
            if (error instanceof TestRunnerError) {
                throw error;
            }
            console.error(`Failed to download file for step: ${error.message}`);
            throw new TestRunnerError(`Failed to download file: ${error.message}`);
        }
    }

    public async updateStepsDefinition() {
        console.log('Updating configuration...');

        // ... inside suite > test
        for (const suite of this.suites) {
            for (const test of suite.tests) {
                for (const step of test.steps) {
                    if (step.command === 'upload-file') {
                        await this.updateDownloadFile(step, test.name);
                    }
                }
            }
        }

        // ... inside functions
        for (const func of this._functions) {
            for (const step of func.steps) {
                if (step.command === 'upload-file') {
                    await this.updateDownloadFile(step, func.name);
                }
            }
        }
    }

    public async startSession(sessionType: string, sessionName: string): Promise<void> {
        console.log(`Starting ${sessionType} session: ${sessionName}`);

        const session = this._sessions.find((s) => s.type === sessionType);
        if (!session) {
            throw new TestRunnerError(`No configuration found for session type: ${sessionType}`);
        }

        try {
            if (sessionType === 'web' && TestRunner.savedWebDriver && this._runConfiguration?.keepSession) {
                session.driver = TestRunner.savedWebDriver;
            } else if (
                sessionType === 'mobile' &&
                TestRunner.savedMobileDriver &&
                this._runConfiguration?.keepSession
            ) {
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

    public async terminateAllSessions() {
        if (this._sessionPinger) {
            await this._sessionPinger.stop();
        }

        await this.closeSessions();
    }

    public async run(): Promise<RunResult> {
        const runStartTime = Date.now();
        let runCompleted = false;
        let success = true;

        try {
            this.initSessions();

            await this.updateStepsDefinition();

            console.log(`Test run started with ${this._suites.length} suite(s)`);

            const suiteResults: SuiteResult[] = [];
            const promises: Promise<void>[] = [];

            for (let i = 0; i < this._suites.length; i++) {
                const suite = this._suites[i];
                const suitePromises = await suite.run(this._sessions, this.functions, this.apis, this._variables, this);
                promises.push(...suitePromises);

                const suiteResult = suite.report();
                suiteResults.push(suiteResult);

                mergeVariables(this._variables, suite.variables);

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
                error: (error as Error).message
            };
        } finally {
            await this.terminateAllSessions();
        }
    }

    public async runSuite(suite: Suite): Promise<SuiteResult> {
        console.log(`Starting suite ${suite.name} run...`);

        try {
            const suitePromises = await suite.run(this.sessions, this.functions, this.apis, this.variables, this);
            const suiteResult = await suite.report();

            mergeVariables(this.variables, suite.variables);
            await Promise.all(suitePromises);

            console.log(`suite ${suite.name} run completed.`);
            return suiteResult;
        } catch (error) {
            console.error('Error running suite:', error);
            throw new TestRunnerError(`Error running suite: ${(error as Error).message}`);
        }
    }

    private calculateSummary(suiteResults: any[]): RunSummary {
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
        for (const session of this._sessions) {
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
