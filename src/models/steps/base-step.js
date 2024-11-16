const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables, prepareLocalScript } = require('../../helpers/utils');
const TestCondition = require('./test-condition');
const vmRun = require('@danielyaghil/vm-helper');

class BaseStep {
    #conf = null;

    #sequence = 0;
    #command = '';
    #selectors = [];
    #position = -1;
    #value = null;
    #operator = null;

    #selectorsPerPlatform = {};
    #variables = null;
    #videoRecorder = null;

    #status = 'pending';
    #usedSelectors = '';
    #errorDetails = '';

    #condition = null;

    #originalBorderCSS = '';

    static #commands = [
        //generic
        'pause',
        'navigate',

        //settings
        'toggle-location-services',
        'toggle-airplane-mode',
        //'set-google-account',
        'set-geolocation',

        //variables
        'set-variable',
        'set-variable-from-element',
        'set-variable-from-script',
        'generate-random-integer',
        'generate-random-string',

        //actions
        'click',
        'multiple-clicks',
        'click-coordinates',
        'set-value',
        'clear-value',
        'add-value',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right',
        'scroll-left',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'press-key',
        'execute-script',
        'perform-actions',

        //assertions
        'wait-for-exist',
        'wait-for-not-exist',
        'assert-is-displayed',
        'assert-is-not-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute',
        'assert-app-installed'
    ];
    static #commandsRequireItem = [
        'click',
        'multiple-clicks',
        'set-value',
        'clear-value',
        'add-value',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'set-variable-from-element',
        'assert-is-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute'
    ];
    static #commandsRequireSelector = [
        ...BaseStep.#commandsRequireItem,
        'wait-for-exist',
        'wait-for-not-exist',
        'assert-is-not-displayed',
        'scroll-up-to-element',
        'scroll-down-to-element'
    ];
    static #commandsRequireValue = [
        'multiple-clicks',
        'click-coordinates',
        'set-value',
        'press-key',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute',
        'assert-app-installed',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right',
        'scroll-left',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'generate-random-integer',
        'generate-random-string',
        'toggle-location-services',
        //'set-google-account',
        'set-geolocation',
        'execute-script',
        'perform-actions',
        'set-variable',
        'set-variable-from-script',
        'navigate'
    ];

    constructor(sequence, step) {
        this.#sequence = sequence;
        this.#command = step.command;
        this.#selectors = step.selectors;
        this.#position = step.position ?? -1;
        this.#value = step.value;
        this.#operator = step.operator;
        this.#condition = step.condition ? new TestCondition(step.condition) : null;

        this.#build();
        this.#isValid();
    }

    //#region getters

    get command() {
        return this.#command;
    }

    get selectors() {
        return this.#selectors;
    }

    get value() {
        return this.#value;
    }

    set value(value) {
        this.#value = value;
    }

    get status() {
        return this.#status;
    }

    get operator() {
        return this.#operator;
    }

    get usedSelector() {
        return this.#usedSelectors;
    }

    get errorDetails() {
        return this.#errorDetails;
    }

    get variables() {
        return this.#variables;
    }

    get conf() {
        return this.#conf;
    }

    //#endregion

    //#region  validation

    #requiresItem(command) {
        return BaseStep.#commandsRequireItem.includes(command);
    }

    #requiresSelector(command) {
        return BaseStep.#commandsRequireSelector.includes(command);
    }

    #requiresValue(command) {
        return BaseStep.#commandsRequireValue.includes(command);
    }

    #isValid() {
        if (!this.#command) {
            throw new TestDefinitionError(`Command is required for step ${this.#sequence}`);
        }

        if (!BaseStep.#commands.includes(this.#command)) {
            throw new TestDefinitionError(`Command ${this.#command} is not a valid one - step ${this.#sequence}`);
        }

        if (this.#requiresSelector(this.#command) && !this.#selectors && this.#selectors.length === 0) {
            throw new TestDefinitionError(`Selector is required for step ${this.#sequence}`);
        }

        if (this.#requiresValue(this.#command) && !this.#value) {
            throw new TestDefinitionError(`Value is required for step ${this.#sequence}`);
        }

        if (this.#command === 'execute-script') {
            if (!this.#operator || this.#operator === 'sync') {
                if (!this.#value.includes('return')) {
                    throw new TestDefinitionError(
                        `ExecuteScript::Script for step ${this.#sequence} should contain "return" to indicate to the system the script has completed and with what output`
                    );
                }
            } else if (this.#operator !== 'local') {
                throw new TestDefinitionError(
                    `ExecuteScript::Script for step ${this.#sequence} has invalid operator "${this.#operator} (should be only 'sync', 'async' or 'local')`
                );
            }
        }

        if (this.#condition) {
            this.#condition.isValid();
        }

        return true;
    }

    #selectorsForPlatform(platform) {
        return this.#selectorsPerPlatform[platform] ?? this.#selectorsPerPlatform['default'];
    }

    //#endregion

    //#region build

    #addSelector(platform, selector) {
        if (!this.#selectorsPerPlatform[platform]) {
            this.#selectorsPerPlatform[platform] = [];
        }
        this.#selectorsPerPlatform[platform].push(selector);
    }

    #build() {
        // Build the test step
        if (this.#selectors) {
            for (let i = 0; i < this.#selectors.length; i++) {
                let selector = this.#selectors[i];
                let selectorParts = selector.split('|||');
                if (selectorParts.length === 1) {
                    this.#addSelector('default', selector);
                } else {
                    let platform = selectorParts[0];
                    let value = selectorParts[1];
                    this.#addSelector(platform, value);
                }
            }
        }
        return;
    }

    //#endregion

    //#region run

    async addFrameToVideo() {
        if (this.#videoRecorder) {
            await this.#videoRecorder.addFrame();
        }
    }

    async highlightElement(driver, item) {
        if (!item || item === 'noItem' || this.#conf.runType !== 'web') {
            return;
        }

        try {
            this.#originalBorderCSS = await item.getCSSProperty('border');
            await driver.execute((el) => {
                let elt = el;
                console.log(`'elt = ${elt}' - parent = ${elt.parentNode} - children = ${elt.parentNode.children}`);
                while (elt.parentNode && elt.parentNode.children.length == 1) {
                    elt = elt.parentNode;
                }
                elt.style.border = '3px solid orangered';
            }, item);
            console.log('highlighted');
        } catch (error) {
            console.log('Could not be highlighted');
        }
    }

    async revertElement(driver, item) {
        if (!item || item === 'noItem' || !this.#originalBorderCSS || this.#conf.runType !== 'web') {
            return;
        }

        try {
            await driver.execute(
                (el, css) => {
                    let elt = el;
                    while (elt.parentNode && elt.parentNode.children.length == 1) {
                        elt = elt.parentNode;
                    }

                    elt.style.border = css;
                },
                item,
                this.#originalBorderCSS.value
            );
            console.log('highlight reverted');
        } catch (error) {
            console.log(`Error reverting border: ${error}`);
        } finally {
            this.#originalBorderCSS = '';
        }
    }

    async run(driver, variables, conf, videoRecorder) {
        this.#conf = conf;
        this.#variables = variables;
        this.#videoRecorder = videoRecorder;

        try {
            if (this.#condition) {
                let conditionResult = await this.#condition.evaluate(driver, variables, conf);
                if (!conditionResult) {
                    this.#status = 'skipped';
                    console.log(`TestStep::Condition for step ${this.#sequence} was not met - step skipped`);
                    return true;
                }
            }

            const item = this.#requiresItem(this.#command) ? await this.selectItem(driver) : 'noItem';
            if (!item) {
                throw new TestItemNotFoundError(`Item with selectors [${this.#usedSelectors}]  not found`);
            }

            await this.highlightElement(driver, item);

            await this.execute(driver, item);

            await this.addFrameToVideo();

            await this.revertElement(driver, item);
        } catch (error) {
            this.#status = 'failed';
            this.#errorDetails = `${error.message}`;

            await this.addFrameToVideo();

            return false;
        }

        return true;
    }

    async selectItem(driver) {
        // Implement item selection logic
        let selectors = this.#selectorsForPlatform(driver.capabilities.platformName.toLowerCase());
        let item = null;
        this.#usedSelectors = '';
        for (let i = 0; i < selectors.length; i++) {
            const selector = replaceVariables(selectors[i], this.#variables);
            if (this.#usedSelectors.length > 0) {
                this.#usedSelectors += ',';
            }
            this.#usedSelectors += `"${selector}"`;

            if (this.#position == -1) {
                item = await driver.$(selector);
            } else {
                const items = await driver.$$(selector);
                if (items && !items.error && items.length > this.#position) {
                    item = items[this.#position];
                }
            }
            if (item && !item.error) {
                break;
            }
        }
        if (!item || item.error) {
            return null;
        }
        return item;
    }

    async executeScript(driver) {
        try {
            if (this.#operator === 'sync') {
                const script = replaceVariables(this.#value, this.#variables);
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this.#sequence} failed`);
                }
                console.log(`ExecuteScript::Script: script for step ${this.#sequence} returns ${result}`);
                return result;
            } else {
                const localScript = prepareLocalScript(this.#value, this.#variables);
                const result = await vmRun(localScript, this.#variables);
                if (!result || !result.success) {
                    throw new TestRunnerError(
                        `ExecuteScript::Script: local script for step ${this.#sequence} failed ${result.error}`
                    );
                }
                console.log(
                    `ExecuteScript::Script: local script for step ${this.#sequence} returns ${JSON.stringify(result)}`
                );
                return result.output;
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(
                    `ExecuteScript::Script: script for step ${this.#sequence} failed with error ${error}`
                );
            }
        }
    }

    async execute(driver, item) {
        console.log(`Execute method is not implemented - ${driver} - ${item}`);
        throw new TestRunnerError('Execute method is not implemented');
    }

    //#endregion
}

module.exports = BaseStep;
