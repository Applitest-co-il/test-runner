const { TestDefinitionError, TestRunnerError } = require('../helpers/test-errors');
const { replaceVariables, prepareLocalScript } = require('../helpers/utils');
const vmRun = require('@danielyaghil/vm-helper');

class TestCondition {
    #conf = null;

    #type = '';
    #selector = '';
    #script = '';
    #value = '';

    constructor(condition) {
        this.#type = condition.type;
        this.#selector = condition.selector;
        this.#script = condition.script;
        this.#value = condition.value;
    }

    isValid() {
        if (!this.#type) {
            throw new TestDefinitionError('Condition type is required');
        }

        switch (this.#type) {
            case 'exist':
                if (!this.#selector) {
                    throw new TestDefinitionError('Selector is required for exist condition');
                }
                break;
            case 'not-exist':
                if (!this.#selector) {
                    throw new TestDefinitionError('Selector is required for not-exist condition');
                }
                break;
            case 'script':
                if (!this.#script) {
                    throw new TestDefinitionError('Script is required for script condition');
                }
                break;
            case 'value':
                if (!this.#selector) {
                    throw new TestDefinitionError('Selector is required for value condition');
                }
                if (!this.#value) {
                    throw new TestDefinitionError('Value is required for value condition');
                }
                break;
            case 'property':
                if (!this.#selector) {
                    throw new TestDefinitionError('Selector is required for property condition');
                }
                if (!this.#value) {
                    throw new TestDefinitionError('Property and value are required for property condition');
                }
                break;
            default:
                throw new TestDefinitionError(`Condition type ${this.#type} is not a valid one`);
        }

        return true;
    }

    async evaluate(driver, variables, conf) {
        switch (this.#type) {
            case 'exist':
                return await this.#existCheck(driver, variables);
            case 'not-exist':
                return !(await this.#existCheck(driver, variables));
            case 'script':
                return await this.#scriptCheck(driver, variables, conf);
            case 'value':
                return await this.#valueCheck(driver, variables);
            default:
                throw new TestDefinitionError(`Condition type ${this.#type} is not a valid one`);
        }
    }

    async #existCheck(driver, variables) {
        let selector = replaceVariables(this.#selector, variables);
        let item = await driver.$(selector);
        return item && !item.error;
    }

    async #scriptCheck(driver, variables, conf) {
        let script = replaceVariables(this.#script, variables);
        let result = null;
        if (conf.runType === 'web') {
            script = `() => { ${script} }`;
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

    async #valueCheck(driver, variables) {
        let selector = replaceVariables(this.#selector, variables);
        let item = await driver.$(selector);
        if (!item || item.error) {
            return false;
        }
        let text = await item.getText();
        let value = replaceVariables(this.#value, variables);
        return text === value;
    }
}

module.exports = TestCondition;
