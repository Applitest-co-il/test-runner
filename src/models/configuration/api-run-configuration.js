const RunConfiguration = require('./base-run-configuration');

class ApiRunConfiguration extends RunConfiguration {
    constructor(options) {
        super(options);
    }

    async startSession(_) {
        return null; // No session management for API runs
    }
}

module.exports = ApiRunConfiguration;
