import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

class ToggleLocationServicesStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const value = replaceVariables(this.value || '', this.variables || {});
        try {
            const capabilities = (driver as any).capabilities;
            if (capabilities.platformName.toLowerCase() === 'android') {
                if (capabilities.platformVersion >= 10.0) {
                    // Toggle location services using shell command
                    const toggleCommand =
                        value === 'on' ? 'settings put secure location_mode 3' : 'settings put secure location_mode 0';
                    await driver.execute('mobile: shell', { command: toggleCommand });
                } else {
                    const toggleCommand =
                        value === 'on'
                            ? 'settings put secure location_providers_allowed +gps'
                            : 'settings put secure location_providers_allowed -gps';
                    await driver.execute('mobile: shell', { command: toggleCommand });
                }
            }
        } catch (error: any) {
            throw new TestRunnerError(
                `ToggleLocationServices::Failed to toggle location services to "${value}". Error: ${error.message}`
            );
        }
    }
}

export = ToggleLocationServicesStep;
