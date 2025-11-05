const TestRunner = require('../models/test-runner.js');
const {
    TestRunnerConfigurationError,
    TestRunnerError,
    TestDefinitionError,
    TestItemNotFoundError,
    TestAbuseError
} = require('../helpers/test-errors');
const { apiCall } = require('../helpers/apicall.js');
const { replaceVariables } = require('../helpers/utils.js');
const { v4: uuids4 } = require('uuid');
const libVersion = require('./version.json');

let trSessionCache = null;

async function runTests(options) {
    console.log(`TestRunnerLib::runTests::${libVersion.version}`);

    const startDate = new Date();
    const testRunner = new TestRunner(options);

    const suiteResults = await testRunner.run();

    const endDate = new Date();
    const duration = (endDate - startDate) / 1000;

    let output = null;

    if (suiteResults) {
        let success = true;
        let summary = {
            suites: suiteResults.length,
            passedSuites: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            pending: 0
        };
        for (let i = 0; i < suiteResults.length; i++) {
            success = success && suiteResults[i].success;
            summary.passedSuites += suiteResults[i].success ? 1 : 0;
            summary.total += suiteResults[i].summary.total;
            summary.passed += suiteResults[i].summary.passed;
            summary.failed += suiteResults[i].summary.failed;
            summary.skipped += suiteResults[i].summary.skipped;
            summary.pending += suiteResults[i].summary.pending;
        }

        output = {
            runCompleted: true,
            success: success,
            summary: summary,
            suiteResults: suiteResults,
            executionTime: duration
        };
    } else {
        output = {
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

async function openSession(options) {
    console.log(`TestRunnerLib::openSession::${libVersion.version}`);

    if (trSessionCache) {
        console.log('Closing existing session');
        trSessionCache.testRunner.terminateAllSessions();
        trSessionCache = null;
    }

    const startDate = new Date();
    const testRunner = new TestRunner(options);
    await testRunner.initSessions();

    if (!testRunner.sessions || testRunner.sessions.length === 0) {
        return {
            success: false,
            message: 'No sessions defined in configuration'
        };
    }

    await testRunner.startSession(testRunner.sessions[0].type);

    trSessionCache = {
        sessionId: uuids4(),
        testRunner: testRunner,
        savedElements: {}
    };

    const endDate = new Date();
    const duration = (endDate - startDate) / 1000;

    console.log(`TestRunnerLib::openSession::${libVersion.version}:Ended`);
    return {
        success: true,
        executionTime: duration,
        sessionId: trSessionCache.sessionId
    };
}

async function runSession(sessionId, options) {
    console.log(`TestRunnerLib::runSession::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const startDate = new Date();

    await trSessionCache.testRunner.initSuites(options);
    if (trSessionCache.testRunner.suites.length === 0 || trSessionCache.testRunner.suites.length > 1) {
        console.error('Invalid suites configuration');
        return {
            success: false,
            message: 'Invalid suites configuration'
        };
    }

    await trSessionCache.testRunner.initFunctions(options);
    await trSessionCache.testRunner.initApis(options);
    await trSessionCache.testRunner.updateConfiguration();

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
    const result = await trSessionCache.testRunner.runSuite(suite);
    // Add distinct savedElements to trSessionCache.savedElements
    if (suite.tests) {
        for (const test of suite.tests) {
            if (test.savedElements) {
                Object.assign(trSessionCache.savedElements, test.savedElements);
            }
        }
    }

    const endDate = new Date();
    const duration = (endDate - startDate) / 1000;

    console.log(`TestRunnerLib::runSession::${libVersion.version}:Ended`);
    return {
        success: result.suiteResult.success,
        executionTime: duration,
        suiteResult: result.suiteResult
    };
}

async function getAxTree(sessionId, selector = null) {
    console.log(`TestRunnerLib::getAxTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = trSessionCache.testRunner.sessions[0].driver;
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
            console.error(`Error getting accessibility tree: ${error.message}`);
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

async function getDomTree(sessionId, selector = null) {
    console.log(`TestRunnerLib::getDomTree::${libVersion.version}`);

    if (!trSessionCache || trSessionCache.sessionId !== sessionId) {
        return {
            success: false,
            message: 'Invalid session ID or no session open'
        };
    }

    const driver = trSessionCache.testRunner.sessions[0].driver;
    let domTree = null;

    try {
        if (selector) {
            // Extract DOM tree for specific element using JavaScript
            const { extractDom } = require('../helpers/accessibility-utils.js');
            domTree = await driver.execute(extractDom, selector);
        } else {
            // Extract DOM tree for entire page
            const { extractDom } = require('../helpers/accessibility-utils.js');
            domTree = await driver.execute(extractDom);
        }
    } catch (error) {
        console.error(`Error getting DOM tree: ${error.message}`);
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

async function doStep(sessionId, selector, stepCommand, stepValue) {
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

    const options = {
        suites: suites,
        functions: [],
        apis: []
    };

    const result = await runSession(sessionId, options);

    return {
        success: result.suiteResult.success
    };
}

async function closeSession(sessionId) {
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
    await trSessionCache.testRunner.terminateAllSessions();
    trSessionCache = null;
    const endDate = new Date();
    const duration = (endDate - startDate) / 1000;

    console.log(`TestRunnerLib::closeSession::${libVersion.version}:Ended`);
    return {
        success: true,
        executionTime: duration
    };
}

async function testApiCall(method, path, headers, data, schema, variables, outputs) {
    const url = replaceVariables(`${path}`, variables);

    let apiHeaders = '';
    if (headers) {
        if (typeof headers == 'object') {
            apiHeaders = JSON.stringify(headers);
        } else {
            apiHeaders = headers;
        }

        apiHeaders = apiHeaders.replace(/\s+/g, ' ').trim();
        apiHeaders = replaceVariables(apiHeaders, variables);
    }

    let apiData = '';
    if (data) {
        if (typeof data == 'object') {
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
        console.error(`API call error: ${error.message}`);
        return null;
    }
}

module.exports.runTests = runTests;
module.exports.testApiCall = testApiCall;
module.exports.openSession = openSession;
module.exports.runSession = runSession;
module.exports.getAxTree = getAxTree;
module.exports.getDomTree = getDomTree;
module.exports.doStep = doStep;
module.exports.closeSession = closeSession;

module.exports.TestRunnerConfigurationError = TestRunnerConfigurationError;
module.exports.TestRunnerError = TestRunnerError;
module.exports.TestDefinitionError = TestDefinitionError;
module.exports.TestItemNotFoundError = TestItemNotFoundError;
module.exports.TestAbuseError = TestAbuseError;
module.exports.libVersion = libVersion;
