const express = require('express');
const cors = require('cors');

const { downloadFile } = require('../helpers/download-file.js');
const { runTests } = require('../helpers/runner.js');

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

        const appLocalPath = await downloadFile(url, appName);
        if (!appLocalPath) {
            res.status(500).send('App download failed');
            return;
        }
        options.runConfiguration.appium.app = appLocalPath;
    }

    const output = await runTests(options);

    res.status(200).json(output);
});

app.listen(8282, () => {
    console.log('Server started on port 8282');
});
