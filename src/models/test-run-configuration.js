const RunConfigurationWeb = require('./configuration/web-run-configuration');
const RunConfigurationMobile = require('./configuration/mobile-run-configuration');
const RunConfigurationApi = require('./configuration/api-run-configuration');
const { TestRunnerConfigurationError } = require('../helpers/test-errors');

function runConfigurationFactory(options) {
    if (!options) {
        throw new TestRunnerConfigurationError('No options provided');
    }

    if (!options.sessions || options.sessions.length === 0) {
        throw new TestRunnerConfigurationError('No sessions found');
    }

    const runSessions = [];
    for (let i = 0; i < options.sessions.length; i++) {
        let session = options.sessions[i];

        let runConf = null;
        switch (session.type) {
            case 'mobile':
                runConf = new RunConfigurationMobile(options, session);
                break;
            case 'web':
                runConf = new RunConfigurationWeb(options, session);
                break;
            case 'api':
                runConf = new RunConfigurationApi(options);
                break;
            default:
                throw new TestRunnerConfigurationError('Invalid session type provided');
        }
        runSessions.push({ type: session.type, runConf: runConf, driver: null });
    }
    return runSessions;
}

module.exports = {
    runConfigurationFactory
};
