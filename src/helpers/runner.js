const TestRunner = require('../models/test-runner.js');

async function runTests(options) {
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
            suitesPassed: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            pending: 0
        };
        for (let i = 0; i < suiteResults.length; i++) {
            success = success && suiteResults[i].success;
            summary.suitesPassed += suiteResults[i].success ? 1 : 0;
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
                suitesPassed: 0,
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

    return output;
}

module.exports = { runTests };
