import RunConfiguration = require('./base-run-configuration');
import { ExtendedBrowser } from '../../types';

class ApiRunConfiguration extends RunConfiguration {
    constructor(options: any) {
        super(options);
    }

    async startSession(_: string): Promise<ExtendedBrowser> {
        return null as any; // No session management for API runs
    }
}

export = ApiRunConfiguration;
