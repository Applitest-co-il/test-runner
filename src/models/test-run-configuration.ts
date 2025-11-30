import WebDriverConfiguration from './configuration/web-driver-configuration';
import MobileDriverConfiguration from './configuration/mobile-driver-configuration';
import DriverConfiguration from './configuration/base-driver-configuration';
import ApiRunConfiguration from './configuration/api-run-configuration';
import { TestRunnerConfigurationError } from '../helpers/test-errors';
import { RunConfiguration, RunSession } from '../types';

export function runConfigurationFactory(options: RunConfiguration): RunSession[] {
    if (!options) {
        throw new TestRunnerConfigurationError('No options provided');
    }

    if (!options.sessions || options.sessions.length === 0) {
        throw new TestRunnerConfigurationError('No sessions found');
    }

    const runSessions: RunSession[] = [];
    for (let i = 0; i < options.sessions.length; i++) {
        let session = options.sessions[i];

        let runConf: DriverConfiguration | undefined = undefined;
        switch (session.type) {
            case 'mobile':
                runConf = new MobileDriverConfiguration(options, session);
                break;
            case 'web':
                runConf = new WebDriverConfiguration(options, session);
                break;
            case 'api':
                runConf = new ApiRunConfiguration(options);
                break;
            default:
                throw new TestRunnerConfigurationError('Invalid session type provided');
        }
        runSessions.push({ type: session.type, runConf });
    }
    return runSessions;
}
