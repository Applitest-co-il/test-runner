import DriverConfiguration from './base-driver-configuration';
import { Browser } from 'webdriverio';

class ApiRunConfiguration extends DriverConfiguration {
    constructor(options: any) {
        super(options);
    }

    async startSession(_: string): Promise<Browser | null> {
        return null;
    }
}

export = ApiRunConfiguration;
