require('dotenv').config({ path: './.env', debug: true });
const express = require('express');
const cors = require('cors');

const { downloadFile } = require('../helpers/download-file.js');
const { runTests } = require('../lib/index.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500KB' }));

app.patch('/test-runner', async (req, res) => {
    console.log('Test runner started');

    if (!req.body) {
        res.status(400).send('No data found');
        return;
    }

    const options = req.body;

    if (['mobile', 'mixed'].includes(options?.runConfiguration?.runType)) {
        console.log('Received mobile run configuration');
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
    } else if (options?.runConfiguration?.runType === 'web') {
        console.log('Received web run configuration');
    } else {
        res.status(400).send('Invalid run type - only mobile supported .... so far....');
        return;
    }

    options.runConfiguration.videosPath = process.env.VIDEOS_PATH;

    const output = await runTests(options);

    res.status(200).json(output);
});

app.listen(process.env.TR_PORT, () => {
    console.log(`Server started on port ${process.env.TR_PORT}`);
});
