import BaseStep from './base-step';
import { TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables } from '../../helpers/utils';
import { checkAppIsInstalled } from '../../helpers/mobile-utils';
import { TestStep } from '../../types';
import { Browser, ChainablePromiseElement } from 'webdriverio';

class AssertAppInstalledStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        const app = replaceVariables(this.value || '', this.variables || {});
        try {
            const isInstalled = await checkAppIsInstalled(driver, app);
            if (!isInstalled) {
                throw new TestRunnerError(`AssertAppInstalled::App "${app}" is not installed`);
            }
        } catch (error: any) {
            throw new TestRunnerError(
                `AssertAppInstalled::Failed to check if app "${app}" is installed. Error: ${error.message}`
            );
        }
    }
}

export = AssertAppInstalledStep;
