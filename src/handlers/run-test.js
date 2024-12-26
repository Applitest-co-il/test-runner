const { S3Client } = require('@danielyaghil/aws-helpers');
const { downloadFile } = require('../helpers/download-file.js');
const { runTests } = require('../helpers/runner.js');
const fs = require('fs');
const { report } = require('process');

async function run(event, context) {
    let time = new Date();
    console.log(`Cron "${context.functionName}" started at ${time}`);

    try {
        for (const message of event.Records) {
            let messageBody = message.body;
            if (typeof messageBody === 'string') {
                messageBody = JSON.parse(messageBody);
            }
            await processMessage(messageBody);
        }
    } catch (err) {
        console.error(`TestRunner::Error:: ${err}`);
        return false;
    }

    time = new Date();
    console.log(`Cron "${context.functionName}" completed at ${time}`);
    return true;
}

//#region support methods

async function reportFailure(reportBucket, reportKey, errorMessage) {
    const output = {
        runCompleted: true,
        success: false,
        runningError: errorMessage
    };
    await reportOutput(reportBucket, reportKey, output);
}

async function reportOutput(reportBucket, reportKey, output) {
    const s3Instance = S3Client.instance();
    await s3Instance.put(reportBucket, reportKey, 'private', JSON.stringify(output));
}

//#endregion

//#region main methods

async function getConf(confUrl, reportBucket, reportKey) {
    try {
        console.log(
            `TestRunner::Getting Configuration With aregs "${confUrl}", "${reportBucket}", "${reportKey}", "$ `
        );

        const localConf = await downloadFile(confUrl, 'options.json', true);
        if (!localConf) {
            const errMsg = `TestRunner::Error::Configuration  ${confUrl} could not be retrieved`;
            console.error(errMsg);
            await reportFailure(reportBucket, reportKey, errMsg);
            return null;
        }

        const data = await fs.promises.readFile(localConf, 'utf-8');
        const runConf = JSON.parse(data);
        await fs.promises.unlink(localConf);
        if (!runConf) {
            const error = `TestRunner::Error::Configuration  ${confUrl} could not be parsed`;
            console.error(error);
            await reportFailure(reportBucket, reportKey, error);
            return null;
        }

        return runConf;
    } catch (err) {
        const errMsg = `TestRunner::Error:: ${err}`;
        console.error(errMsg);
        await reportFailure(reportBucket, reportKey, errMsg);
        return null;
    }
}

async function processMessage(testRunDetail) {
    console.log(`TestRunnerHandler::Run Message: ${JSON.stringify(testRunDetail)}`);

    const reportBucket = testRunDetail.reportBucket;
    const reportFolder = testRunDetail.reportFolder;
    const reportKey = `${reportFolder}/reports.json`;

    let runConf = await getConf(testRunDetail.confUrl, reportBucket, reportKey);
    if (!runConf) {
        return;
    }

    let output = null;

    try {
        output = await runTests(runConf);
        await reportOutput(reportBucket, reportKey, output);
    } catch (err) {
        const errMsg = `TestRunner::Error:: ${err}`;
        console.error(errMsg);
        throw err; //here we throw an error so message can be reprocessed in queue
    }

    try {
        const localVideosFolder = process.env.NODE_ENV == 'prod' ? `/tmp/videos` : `${process.cwd()}/reports/videos`;
        const s3Instance = await S3Client.instance();
        const videos = await fs.promises.readdir(localVideosFolder);
        for (const video of videos) {
            if (!video.endsWith('.mp4')) {
                continue;
            }
            const videoKey = `${reportFolder}/videos/${video}`;
            let stream = fs.createReadStream(`${localVideosFolder}/${video}`);
            await s3Instance.put(reportBucket, videoKey, 'private', stream);

            //unlink local video
            await fs.promises.unlink(`${localVideosFolder}/${video}`);
        }
    } catch (err) {
        const errMsg = `TestRunner::Error Saving Videos:: ${err}`;
        console.error(errMsg);
        const reportErrorKey = `${reportFolder}/errors.json`;
        await reportFailure(reportBucket, reportErrorKey, errMsg);
    }
}

//#endregion

module.exports.run = run;
