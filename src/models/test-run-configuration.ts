import RunConfigurationWeb from './configuration/web-run-configuration';
import RunConfigurationMobile from './configuration/mobile-run-configuration';
import RunConfigurationApi from './configuration/api-run-configuration';
import { TestRunnerConfigurationError } from '../helpers/test-errors';
import { TestRunConfiguration, SessionConfiguration } from '../types';

interface RunSession {
    type: string;
    runConf: any; // Will be typed when all configuration classes are converted
    driver: any;
}

export function runConfigurationFactory(options: TestRunConfiguration): RunSession[] {
    if (!options) {
        throw new TestRunnerConfigurationError('No options provided');
    }

    if (!options.sessions || options.sessions.length === 0) {
        throw new TestRunnerConfigurationError('No sessions found');
    }

    const runSessions: RunSession[] = [];
    for (let i = 0; i < options.sessions.length; i++) {
        let session = options.sessions[i];

        let runConf: any = null;
        switch (session.runType) {
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
        runSessions.push({ type: session.runType, runConf: runConf, driver: null });
    }
    return runSessions;
}
