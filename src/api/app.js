const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config({ path: './.env', debug: true });

const TestRunner = require('../models/test-runner.js');

const app = express();
app.use(cors());
app.use(express.json());

app.patch('/test-runner', async (req, res) => {
    console.log('Test runner started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const options = req.body;

    if (options?.runConfiguration?.runType !== 'mobile') {
        res.status(400).send('Invalid run type - only mobile supported .... so far....');
        return;
    }

    if (options?.runConfiguration?.appium?.app?.startsWith('s3:')) {
        const appName = options.runConfiguration.appium.appName;
        const url = options.runConfiguration.appium.app.replace('s3:', '');

        const appLocalPath = await downloadApp(url, appName);
        if (!appLocalPath) {
            res.status(500).send('App download failed');
            return;
        }
        options.runConfiguration.appium.app = appLocalPath;
    }

    const output = await startRunner(options);

    res.status(200).json(output);
});

async function startRunner(options) {
    const testRunner = new TestRunner(options);
    const suiteResults = await testRunner.run();

    let success = true;
    let summary = {
        suites: suiteResults.length,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0
    };
    for (let i = 0; i < suiteResults.length; i++) {
        success = success && suiteResults[i].success;
        summary.total += suiteResults[i].summary.total;
        summary.passed += suiteResults[i].summary.passed;
        summary.failed += suiteResults[i].summary.failed;
        summary.skipped += suiteResults[i].summary.skipped;
        summary.pending += suiteResults[i].summary.pending;
    }

    const output = {
        success: success,
        summary: summary,
        suiteResults: suiteResults
    };

    return output;
}

async function downloadApp(url, appName) {
    const appLocalPath = `${process.cwd()}/downloads/${appName}`;
    const existLocalApp = fs.existsSync(appLocalPath);
    if (existLocalApp) {
        console.log(`App ${appLocalPath} already downloaded`);
        return appLocalPath;
    }

    const downloadResponse = await axios({
        url: url,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(appLocalPath);
    downloadResponse.data.pipe(writer);

    const promise = new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    return promise.then(() => {
        console.log(`File downloaded successfully ${appLocalPath}`);
        return appLocalPath;
    });
}

app.listen(8282, () => {
    console.log('Server started on port 8282');
});
