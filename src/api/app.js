const dotenv = require('dotenv');
dotenv.config({ path: '.env', debug: true });

const express = require('express');
const cors = require('cors');

const { downloadFile } = require('../helpers/download-file.js');
const {
    runTests,
    testApiCall,
    openDebugSession,
    closeDebugSession,
    runDebugSteps,
    libVersion
} = require('../lib/index.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500KB' }));

//#region Utilities

app.get('/version', (_, res) => {
    res.status(200).json({ version: libVersion.version });
});

//#endregion

//#region helpers

async function preProcessOptions(options) {
    if (!options) {
        return false;
    }

    // Additional checks can be added here
    if (['mobile', 'mixed'].includes(options?.runConfiguration?.runType)) {
        console.log('Received mobile run configuration');
        const session = options.runConfiguration.sessions.find((session) => session.type === 'mobile');
        if (session.appium?.app?.startsWith('s3:')) {
            const appName = session.appium.appName;
            const url = session.appium.app.replace('s3:', '');

            const appLocalPath = await downloadFile(url, appName);
            if (!appLocalPath) {
                console.error('App download failed');
                return false;
            }
            session.appium.app = appLocalPath;
        }
    } else if (options?.runConfiguration?.runType === 'web') {
        console.log('Received web run configuration');
    } else if (options?.runConfiguration?.runType === 'api') {
        console.log('Received API run configuration');
    } else {
        return false;
    }

    return true;
}

//#endregion

//#region Browser and App Runner

app.patch('/test-runner', async (req, res) => {
    console.log('Test runner started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const options = req.body;
    if (!(await preProcessOptions(options))) {
        res.status(400).send('Invalid configuration');
        return;
    }

    options.runConfiguration.videosPath = process.env.VIDEOS_PATH;

    let output = {};
    try {
        output = await runTests(options);
    } catch (error) {
        console.log(`Error running test: ${error}`);

        output = {
            success: false,
            error: error.message,
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

    res.status(200).json(output);
});

app.patch('/test-runner/open-debug-session', async (req, res) => {
    console.log('Test runner open session started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const options = req.body;
    if (!(await preProcessOptions(options))) {
        res.status(400).send('Invalid configuration');
        return;
    }

    let output = {};
    try {
        output = await openDebugSession(options);
    } catch (error) {
        console.log(`Error opening debug session: ${error}`);
    }

    res.status(200).json(output);
});

app.patch('/test-runner/run-debug-session/:sessionId', async (req, res) => {
    console.log('Test runner run debug steps started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const sessionId = req.params.sessionId;
    const options = req.body.options;

    let output = {};
    try {
        output = await runDebugSteps(sessionId, options);
    } catch (error) {
        console.log(`Error running debug steps: ${error}`);
    }

    res.status(200).json(output);
});

app.patch('/test-runner/close-debug-session/:sessionId', async (req, res) => {
    console.log('Test runner close session started');

    const sessionId = req.params.sessionId;
    if (!sessionId) {
        res.status(400).send('No session ID found');
        return;
    }

    let output = {};
    try {
        output = await closeDebugSession(sessionId);
    } catch (error) {
        console.log(`Error closing debug session: ${error}`);
    }

    res.status(200).json(output);
});

//#endregion

//#region API

app.patch('/test-api-call', async (req, res) => {
    console.log('Test API call started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const method = req.body.method;
    const path = req.body.path;
    const headers = req.body.headers;
    const data = req.body.data;
    const schema = req.body.schema || null;
    const variables = req.body.variables || {};
    const outputs = req.body.outputs || [];

    if (!method || !path) {
        res.status(400).send('Invalid request - method and path are required');
        return;
    }

    const result = await testApiCall(method, path, headers, data, schema, variables, outputs);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(500).send('API call failed');
    }
    console.log('Test API call completed');
});

//#endregion

app.listen(process.env.TR_PORT, () => {
    console.log(`Server started on port ${process.env.TR_PORT}`);
});
