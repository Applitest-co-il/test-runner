import { RunConfiguration } from '../../types';
import DriverConfiguration from './base-driver-configuration';
import { Browser } from 'webdriverio';

class ApiRunConfiguration extends DriverConfiguration {
    constructor(options: RunConfiguration) {
        super(options);
    }

    async startSession(_: string): Promise<Browser | undefined> {
        return undefined;
    }
}

export = ApiRunConfiguration;
