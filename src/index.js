const commander = require('commander');
//import * as dotenv from 'dotenv';
const fs = require('fs');
const TestRunner = require('./models/test-runner.js');

//dotenv.config({ path: __dirname + '/.env' });

commander
    .version('0.0.1', '-v, --version')
    .usage('[OPTIONS]...')
    .description('A basic CLI tool')
    .requiredOption('-c, --conf <run-configuration.json>', 'Provide run configuration file')
    .parse(process.argv);

async function init() {
    console.log('Starting test runner CLI...');

    const options = commander.opts();
    let jsonData = {};

    if (options.conf) {
        const file = options.conf;
        const data = fs.readFileSync(file, 'utf-8');
        jsonData = JSON.parse(data);
    } else {
        //check queue
    }

    const testRunner = new TestRunner(jsonData);
    const result = await testRunner.run();
    if (!result) {
        throw new Error('Test run failed');
    }
}

init();
