import { TestRunner } from '../models/test-runner';
import {
    TestRunnerConfigurationError,
    TestRunnerError,
    TestDefinitionError,
    TestItemNotFoundError,
    TestAbuseError
} from '../helpers/test-errors';
import { apiCall } from '../helpers/apicall';
import { replaceVariables } from '../helpers/utils';
import { v4 as uuids4 } from 'uuid';
import {
    OutputVariable,
    SessionResult,
    RunResult,
    ApiCallResult,
    TestRunnerOptions,
    SuiteConfiguration,
    TestConfiguration,
    TestStep
} from '../types';
import { extractDom } from '../helpers/accessibility-utils';
import { createLocalTestRunner } from './server';
import { logger, LogLevel } from '../helpers/log-service';
import libVersion from './version.json';
import { ChainablePromiseElement } from 'webdriverio';
import { Accessibility } from '../models/accessibility';

interface SessionCache {
    sessionId: string;
    testRunner: TestRunner;
    savedElements: Record<string, ChainablePromiseElement>;
}

let trSessionCache: SessionCache | null = null;

export async function runTests(options: TestRunnerOptions): Promise<RunResult> {
    logger.info(`TestRunnerLib::runTests::${libVersion.version}`);

    const startDate = new Date();
    const testRunner = new TestRunner(options);

    const result = await testRunner.run();

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    let output: RunResult;

    if (result && result.suiteResults) {
        let success = true;
        let summary = {
            suites: result.suiteResults.length,
            passedSuites: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            pending: 0
        };
        for (let i = 0; i < result.suiteResults.length; i++) {
            success = success && result.suiteResults[i].success;
            summary.passedSuites += result.suiteResults[i].success ? 1 : 0;
            summary.total += result.suiteResults[i].summary.total;
            summary.passed += result.suiteResults[i].summary.passed;
            summary.failed += result.suiteResults[i].summary.failed;
            summary.skipped += result.suiteResults[i].summary.skipped;
            summary.pending += result.suiteResults[i].summary.pending;
        }

        output = {
            runCompleted: true,
            success: success,
            summary: summary,
            suiteResults: result.suiteResults,
            executionTime: duration
        };
    } else {
        output = {
            runCompleted: false,
            success: false,
            error: result.error || 'Test run failed',
            summary: {
                suites: 0,
                passedSuites: 0,
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                pending: 0
            },
            suiteResults: [],
            executionTime: 0
        };
    }

    logger.info(`TestRunnerLib::runTests::${libVersion.version}:Ended`);
    return output;
}

export async function openSession(options: TestRunnerOptions): Promise<SessionResult> {
    logger.info(`TestRunnerLib::openSession::${libVersion.version}`);

    if (trSessionCache) {
        logger.info('Closing existing session');
        await trSessionCache.testRunner.terminateAllSessions();
        trSessionCache = null;
    }

    const startDate = new Date();
    const testRunner = new TestRunner(options);
    testRunner.initSessions();

    if (!testRunner.sessions || testRunner.sessions.length === 0) {
        return {
            success: false,
            message: 'No sessions defined in configuration'
        };
    }

    await testRunner.startSession(testRunner.sessions[0].type, 'session-1');

    trSessionCache = {
        sessionId: uuids4(),
        testRunner: testRunner,
        savedElements: {}
    };

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    logger.info(`TestRunnerLib::openSession::${libVersion.version}:Ended`);
    return {
        success: true,
        executionTime: duration,
        sessionId: trSessionCache.sessionId
    };
}

export async function runSession(sessionId: string, options: TestRunnerOptions): Promise<SessionResult> {
    logger.info(`TestRunnerLib::runSession::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const startDate = new Date();

    trSessionCache.testRunner.initSuites(options);
    if (trSessionCache.testRunner.suites.length === 0 || trSessionCache.testRunner.suites.length > 1) {
        logger.error('Invalid suites configuration');
        throw new TestDefinitionError('Invalid suites configuration - exactly one suite must be defined');
    }

    trSessionCache.testRunner.initFunctions(options);
    trSessionCache.testRunner.initApis(options);

    await trSessionCache.testRunner.updateStepsDefinition();

    if (Object.keys(trSessionCache.savedElements).length > 0) {
        for (const suite of trSessionCache.testRunner.suites) {
            if (suite.tests) {
                for (const test of suite.tests) {
                    if (test.savedElements) {
                        Object.assign(test.savedElements, trSessionCache.savedElements);
                    }
                }
            }
        }
    }

    const suite = trSessionCache.testRunner.suites[0];
    const suiteResult = await trSessionCache.testRunner.runSuite(suite);
    // Add distinct savedElements to trSessionCache.savedElements (only new properties)
    if (suite.tests) {
        for (const test of suite.tests) {
            if (test.savedElements) {
                for (const [key, value] of Object.entries(test.savedElements)) {
                    if (!(key in trSessionCache.savedElements)) {
                        trSessionCache.savedElements[key] = value;
                    }
                }
            }
        }
    }

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    logger.info(`TestRunnerLib::runSession::${libVersion.version}:Ended`);
    return {
        success: suiteResult?.success || false,
        executionTime: duration,
        suiteResult: suiteResult
    };
}

export async function getAxTree(sessionId: string, selector?: string): Promise<SessionResult> {
    logger.info(`TestRunnerLib::getAxTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = trSessionCache.testRunner.sessions[0].driver;
    if (!driver) {
        throw new TestRunnerError('GetAxTree::No driver found for the session');
    }

    const accessibility = new Accessibility(driver);
    let axTree = await accessibility.getAxTree(selector);

    if (!axTree) {
        return {
            success: false,
            message: 'Failed to retrieve accessibility tree'
        };
    }

    return {
        success: true,
        tree: axTree
    };
}

export async function getDomTree(sessionId: string, selector: string | null = null): Promise<SessionResult> {
    logger.info(`TestRunnerLib::getDomTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = trSessionCache.testRunner.sessions[0].driver;
    if (!driver) {
        throw new TestRunnerError('GetDomTree::No driver found for the session');
    }

    let domTree: any = null;
    try {
        if (selector) {
            // Extract DOM tree for specific element using JavaScript
            domTree = await driver.execute(extractDom, selector);
        } else {
            // Extract DOM tree for entire page
            domTree = await driver.execute(extractDom);
        }
    } catch (error) {
        logger.error(`Error getting DOM tree: ${(error as Error).message}`);
    }

    if (!domTree) {
        return {
            success: false,
            message: 'Failed to retrieve DOM tree'
        };
    }

    return {
        success: true,
        tree: domTree
    };
}

export async function doStep(
    sessionId: string,
    selector: string,
    stepCommand: string,
    stepValue: string
): Promise<SessionResult> {
    logger.info(`TestRunnerLib::doStep::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const suites: SuiteConfiguration[] = [
        {
            name: 'Do Step',
            tests: [
                {
                    name: 'Do Step Test',
                    type: 'web',
                    steps: [
                        {
                            selectors: [selector],
                            value: stepValue,
                            command: stepCommand,
                            operator: undefined
                        }
                    ]
                }
            ]
        }
    ];

    const options: TestRunnerOptions = {
        suites: suites,
        functions: [],
        apis: []
    };

    const result = await runSession(sessionId, options);

    return {
        success: result.success
    };
}

export async function closeSession(sessionId: string): Promise<SessionResult> {
    logger.info(`TestRunnerLib::closeSession::${libVersion.version}`);

    if (!trSessionCache) {
        return {
            success: true
        };
    }

    if (trSessionCache.sessionId !== sessionId) {
        logger.error('Invalid session ID or no session open');
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const startDate = new Date();
    await trSessionCache.testRunner.terminateAllSessions();
    trSessionCache = null;
    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    logger.info(`TestRunnerLib::closeSession::${libVersion.version}:Ended`);
    return {
        success: true,
        executionTime: duration
    };
}

export async function testApiCall(
    method: string,
    path: string,
    headers: any,
    data: any,
    schema: any,
    variables: Record<string, string>,
    outputs: OutputVariable[]
): Promise<ApiCallResult | null> {
    const url = replaceVariables(`${path}`, variables);

    let apiHeaders = '';
    if (headers) {
        if (typeof headers === 'object') {
            apiHeaders = JSON.stringify(headers);
        } else {
            apiHeaders = headers;
        }

        apiHeaders = apiHeaders.replace(/\s+/g, ' ').trim();
        apiHeaders = replaceVariables(apiHeaders, variables);
    }

    let apiData = '';
    if (data) {
        if (typeof data === 'object') {
            apiData = JSON.stringify(data);
        } else {
            apiData = data;
        }

        apiData = apiData.replace(/\s+/g, ' ').trim();
        apiData = replaceVariables(apiData, variables);
    }

    try {
        const result = await apiCall(outputs, url, method, apiHeaders, apiData, schema);
        return result;
    } catch (error) {
        logger.error(`API call error: ${(error as Error).message}`);
        return null;
    }
}

// Export error classes, types, version, and server function
export {
    TestRunnerConfigurationError,
    TestRunnerError,
    TestDefinitionError,
    TestItemNotFoundError,
    TestAbuseError,
    SessionResult,
    SuiteConfiguration,
    TestConfiguration,
    TestRunnerOptions,
    TestStep,
    libVersion,
    createLocalTestRunner,
    logger,
    LogLevel
};
