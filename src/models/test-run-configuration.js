const RunConfigurationWeb = require('./configuration/web-run-configuration');
const RunConfigurationMobile = require('./configuration/mobile-run-configuration');
const { TestRunnerConfigurationError } = require('../helpers/test-errors');

function runConfigurationFactory(options) {
    if (!options) {
        throw new TestRunnerConfigurationError('No options provided');
    }

    if (!options.runType) {
        throw new TestRunnerConfigurationError('No run type provided');
    }

    switch (options.runType) {
        case 'mobile':
            return new RunConfigurationMobile(options);
        case 'web':
            return new RunConfigurationWeb(options);
        default:
            throw new TestRunnerConfigurationError('Invalid run type provided');
    }
}

module.exports = {
    runConfigurationFactory
};
