const dotenv = require('dotenv');
dotenv.config({ path: '.env', debug: true });
dotenv.config({ path: '.env.local', debug: true });

const commander = require('commander');
const fs = require('fs');

const { downloadFile } = require('../helpers/download-file.js');
const { runTests } = require('../lib/index.js');

commander
    .version('0.0.1', '-v, --version')
    .usage('[OPTIONS]...')
    .description('A basic CLI tool')
    .option('-c, --conf <options.json>', 'Provide options file')
    .option('-u, --url <url>', 'Provide URL for retrieving configuration file')
    .parse(process.argv);

async function init() {
    console.log('Starting test runner CLI...');

    const options = commander.opts();
    let jsonData = {};

    console.log('Checking configuration...');
    console.log(`CONF: ${options.conf}`);
    console.log(`URL: ${options.url}`);
    console.log(`TR_TEST_CONF_URL: ${process.env.TR_TEST_CONF_URL}`);
    console.log(`TR_FARM: ${process.env.TR_FARM}`);

    if (options.conf) {
        console.log(`Using configuration from file: ${options.conf}`);
        const file = options.conf;
        const data = fs.readFileSync(file, 'utf-8');
        jsonData = JSON.parse(data);
    } else if (options.url) {
        console.log(`Using configuration from URL: ${options.url}`);
        const localConf = await downloadFile(options.url, 'options.json');
        if (!localConf) {
            console.error('Configuration could not be retrieved');
            throw new Error('No configuration provided');
        }
        const data = fs.readFileSync(localConf, 'utf-8');
        jsonData = JSON.parse(data);
    } else if (process.env.TR_TEST_CONF_URL) {
        console.log(`Using configuration from environment variable: ${process.env.TR_TEST_CONF_URL}`);
        const localConf = await downloadFile(process.env.TR_TEST_CONF_URL, 'options.json');
        if (!localConf) {
            console.error('Configuration could not be retrieved');
            throw new Error('No configuration provided');
        }
        const data = fs.readFileSync(localConf, 'utf-8');
        jsonData = JSON.parse(data);
    } else {
        console.error('No configuration provided');
        throw new Error('No configuration provided');
    }

    const output = await runTests(jsonData);
    const reportPath = `${process.env.DEVICEFARM_LOG_DIR ? process.env.DEVICEFARM_LOG_DIR : './reports/'}/report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(output, null, 2));
}

init();
