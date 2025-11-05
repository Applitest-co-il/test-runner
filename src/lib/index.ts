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
import { TestRunConfiguration, SessionCache, OutputVariable } from '../types';

const libVersion = require('./version.json');

let trSessionCache: SessionCache | null = null;

interface RunTestsResult {
    runCompleted: boolean;
    success: boolean;
    summary: {
        suites?: number;
        passedSuites?: number;
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        pending: number;
    };
    suiteResults: any[];
    executionTime: number;
}

interface SessionResult {
    success: boolean;
    message?: string;
    executionTime?: number;
    sessionId?: string;
    suiteResult?: any;
}

interface TreeResult {
    success: boolean;
    message?: string;
    tree?: any;
}

export async function runTests(options: TestRunConfiguration): Promise<RunTestsResult> {
    console.log(`TestRunnerLib::runTests::${libVersion.version}`);

    const startDate = new Date();
    const testRunner = new TestRunner(options);

    const suiteResults = await testRunner.run();

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    let output: RunTestsResult;

    if (suiteResults && suiteResults.suiteResults) {
        let success = true;
        let summary = {
            suites: suiteResults.suiteResults.length,
            passedSuites: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            pending: 0
        };
        for (let i = 0; i < suiteResults.suiteResults.length; i++) {
            success = success && suiteResults.suiteResults[i].success;
            summary.passedSuites += suiteResults.suiteResults[i].success ? 1 : 0;
            summary.total += suiteResults.suiteResults[i].summary.total;
            summary.passed += suiteResults.suiteResults[i].summary.passed;
            summary.failed += suiteResults.suiteResults[i].summary.failed;
            summary.skipped += suiteResults.suiteResults[i].summary.skipped;
            summary.pending += suiteResults.suiteResults[i].summary.pending;
        }

        output = {
            runCompleted: true,
            success: success,
            summary: summary,
            suiteResults: suiteResults.suiteResults,
            executionTime: duration
        };
    } else {
        output = {
            runCompleted: false,
            success: false,
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

    console.log(`TestRunnerLib::runTests::${libVersion.version}:Ended`);
    return output;
}

export async function openSession(options: TestRunConfiguration): Promise<SessionResult> {
    console.log(`TestRunnerLib::openSession::${libVersion.version}`);

    if (trSessionCache) {
        console.log('Closing existing session');
        (trSessionCache.testRunner as any).terminateAllSessions();
        trSessionCache = null;
    }

    const startDate = new Date();
    const testRunner = new TestRunner(options);
    // await testRunner.initSessions();

    if (!testRunner.getSessions || testRunner.getSessions.length === 0) {
        return {
            success: false,
            message: 'No sessions defined in configuration'
        };
    }

    await testRunner.startSession(testRunner.getSessions[0].type, 'session-1');

    trSessionCache = {
        sessionId: uuids4(),
        testRunner: testRunner,
        savedElements: {}
    };

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    console.log(`TestRunnerLib::openSession::${libVersion.version}:Ended`);
    return {
        success: true,
        executionTime: duration,
        sessionId: trSessionCache.sessionId
    };
}

export async function runSession(sessionId: string, options: TestRunConfiguration): Promise<SessionResult> {
    console.log(`TestRunnerLib::runSession::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const startDate = new Date();

    // Initialize based on options
    const testRunner = trSessionCache.testRunner as any;

    if (Object.keys(trSessionCache.savedElements).length > 0) {
        // Apply saved elements to test runner
        // Implementation would depend on the actual test runner structure
    }

    const result = await testRunner.run();

    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    console.log(`TestRunnerLib::runSession::${libVersion.version}:Ended`);
    return {
        success: result.success,
        executionTime: duration,
        suiteResult: result
    };
}

export async function getAxTree(sessionId: string, selector: string | null = null): Promise<TreeResult> {
    console.log(`TestRunnerLib::getAxTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = (trSessionCache.testRunner as any).getSessions[0].driver;
    const puppeteerBrowser = await driver.getPuppeteer();

    // switch to Puppeteer
    const axTree = await driver.call(async () => {
        try {
            const pages = await puppeteerBrowser.pages();
            const page = pages[0];

            if (selector) {
                // Get accessibility snapshot for specific element
                const element = await page.$(selector);
                if (!element) {
                    throw new Error(`Element not found for selector: ${selector}`);
                }
                return page.accessibility.snapshot({ root: element });
            } else {
                // Get accessibility snapshot for entire page
                return page.accessibility.snapshot();
            }
        } catch (error) {
            console.error(`Error getting accessibility tree: ${(error as Error).message}`);
            return null;
        }
    });

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

export async function getDomTree(sessionId: string, selector: string | null = null): Promise<TreeResult> {
    console.log(`TestRunnerLib::getDomTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = (trSessionCache.testRunner as any).getSessions[0].driver;
    let domTree: any = null;

    try {
        if (selector) {
            // Extract DOM tree for specific element using JavaScript
            const { extractDom } = require('../helpers/accessibility-utils');
            domTree = await driver.execute(extractDom, selector);
        } else {
            // Extract DOM tree for entire page
            const { extractDom } = require('../helpers/accessibility-utils');
            domTree = await driver.execute(extractDom);
        }
    } catch (error) {
        console.error(`Error getting DOM tree: ${(error as Error).message}`);
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
    console.log(`TestRunnerLib::doStep::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const suites = [
        {
            name: 'Do Step',
            type: 'web',
            tests: [
                {
                    name: 'Do Step Test',
                    type: 'web',
                    steps: [
                        {
                            commandLabel: '',
                            selectors: [selector],
                            value: stepValue,
                            command: stepCommand,
                            operator: null
                        }
                    ]
                }
            ]
        }
    ];

    const options: any = {
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
    console.log(`TestRunnerLib::closeSession::${libVersion.version}`);

    if (!trSessionCache) {
        return {
            success: true
        };
    }

    if (trSessionCache.sessionId !== sessionId) {
        console.error('Invalid session ID or no session open');
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const startDate = new Date();
    await (trSessionCache.testRunner as any).terminateAllSessions();
    trSessionCache = null;
    const endDate = new Date();
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    console.log(`TestRunnerLib::closeSession::${libVersion.version}:Ended`);
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
    variables: Record<string, any>,
    outputs: OutputVariable[]
): Promise<any> {
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
        console.error(`API call error: ${(error as Error).message}`);
        return null;
    }
}

// Export error classes and version
export {
    TestRunnerConfigurationError,
    TestRunnerError,
    TestDefinitionError,
    TestItemNotFoundError,
    TestAbuseError,
    libVersion
};
