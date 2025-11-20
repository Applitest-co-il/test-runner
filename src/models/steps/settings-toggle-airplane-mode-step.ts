import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

class ToggleAirplaneModeStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _?: any): Promise<void> {
        const value = replaceVariables(this.value || '', this.variables || {});

        try {
            if (value === 'on') {
                await (driver as any).setNetworkConnection(1);
            } else {
                await (driver as any).setNetworkConnection(6);
            }
        } catch (error: any) {
            throw new TestRunnerError(
                `ToggleAirplaneMode::Failed to toggle airplane mode to "${value}". Error: ${error.message}`
            );
        }
    }
}

export = ToggleAirplaneModeStep;
