require('dotenv').config({ path: './.env', debug: true });
const { SqsClient, SecretsClient } = require('@danielyaghil/aws-helpers');
const runTests = require('./run-test');
const { TestRunnerResult } = require('./constants');

async function main() {
    const testRunnerConf = await SecretsClient.instance().get(process.env.TEST_RUNNER_CONF_SECRET);

    const sqsInstance = SqsClient.instance();
    const message = await sqsInstance.receiveMessage(testRunnerConf.queue);

    if (message) {
        console.log(`Received message: ${JSON.stringify(message)}`);

        const events = {
            Records: [message]
        };
        const context = {
            functionName: 'TestRunner'
        };
        const success = await runTests.run(events, context);
        if (success) {
            await sqsInstance.deleteMessage(process.env.TEST_RUNNER_QUEUE_URL, message.receiptHandle);
        } else {
            await sqsInstance.changeMessageVisibility(process.env.TEST_RUNNER_QUEUE_URL, message.receiptHandle, 5);
        }
    } else {
        console.log('No message received');
    }
}

main();
