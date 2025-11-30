import { TestDefinitionError, TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables, prepareLocalScript } from '../../helpers/utils';
import { TestCondition as ITestCondition } from '../../types';
import { Browser } from 'webdriverio';

import vmRun from '@danielyaghil/vm-helper';
import DriverConfiguration from '../configuration/base-driver-configuration';

export default class TestCondition {
    private readonly type: string = '';
    private readonly selector: string = '';
    private readonly script: string = '';
    private readonly value: string = '';

    constructor(condition: ITestCondition) {
        this.type = condition.type;
        this.selector = condition.selector || '';
        this.script = condition.script || '';
        this.value = condition.value || '';
    }

    isValid(): boolean {
        if (!this.type) {
            throw new TestDefinitionError('Condition type is required');
        }

        switch (this.type) {
            case 'exist':
                if (!this.selector) {
                    throw new TestDefinitionError('Selector is required for exist condition');
                }
                break;
            case 'not-exist':
                if (!this.selector) {
                    throw new TestDefinitionError('Selector is required for not-exist condition');
                }
                break;
            case 'script':
                if (!this.script) {
                    throw new TestDefinitionError('Script is required for script condition');
                }
                break;
            case 'value':
                if (!this.selector) {
                    throw new TestDefinitionError('Selector is required for value condition');
                }
                if (!this.value) {
                    throw new TestDefinitionError('Value is required for value condition');
                }
                break;
            case 'browser':
                if (!this.value) {
                    throw new TestDefinitionError('Browser name is required for browser condition');
                }
                break;
            default:
                throw new TestDefinitionError(`Condition type ${this.type} is not unknown`);
        }

        return true;
    }

    async evaluate(driver: Browser, variables: Record<string, string>, conf: DriverConfiguration): Promise<boolean> {
        switch (this.type) {
            case 'exist':
                return await this.existCheck(driver, variables);
            case 'not-exist':
                return !(await this.existCheck(driver, variables));
            case 'script':
                return await this.scriptCheck(driver, variables, conf);
            case 'value':
                return await this.valueCheck(driver, variables);
            case 'browser':
                return await this.browserCheck(driver, variables, conf);
            default:
                throw new TestDefinitionError(`Condition type ${this.type} is not a valid one`);
        }
    }

    private async existCheck(driver: Browser, variables: Record<string, string>): Promise<boolean> {
        let selector = replaceVariables(this.selector, variables);
        let item = await driver.$(selector);
        return item && !(item as any).error;
    }

    private async scriptCheck(
        driver: Browser,
        variables: Record<string, string>,
        conf: DriverConfiguration
    ): Promise<boolean> {
        let script = replaceVariables(this.script, variables);
        let result: any = null;
        if (conf.runType === 'web') {
            result = await driver.execute(script);
        } else {
            const localScript = prepareLocalScript(script);
            const scriptResult = await vmRun(localScript, variables);
            if (scriptResult.success) {
                result = scriptResult.output;
            } else {
                throw new TestRunnerError(`Script condition could not be ran: ${scriptResult.error}`);
            }
        }
        return result;
    }

    private async valueCheck(driver: Browser, variables: Record<string, string>): Promise<boolean> {
        let selector = replaceVariables(this.selector, variables);
        let item = await driver.$(selector);
        if (!item || (item as any).error) {
            return false;
        }
        let text = await item.getText();
        let value = replaceVariables(this.value, variables);
        return text === value;
    }

    private async browserCheck(
        driver: Browser,
        variables: Record<string, string>,
        conf: DriverConfiguration
    ): Promise<boolean> {
        let browserName = replaceVariables(this.value, variables);
        if (conf.runType === 'web') {
            const actualBrowserName = driver.capabilities.browserName?.toLowerCase() || '';
            return actualBrowserName === browserName;
        }
        return false; // For non-web runs, we cannot check browser name
    }
}
