const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../../helpers/test-errors');
const { replaceVariables, prepareLocalScript } = require('../../helpers/utils');
const TestCondition = require('./test-condition');
const vmRun = require('@danielyaghil/vm-helper');
const StepsCommands = require('./abc-steps-commands');

class BaseStep {
    #session = null;

    #sequence = 0;
    #command = '';
    #selectors = [];
    #namedElement = '';
    #position = -1;
    #value = null;
    #operator = null;

    #selectorsPerPlatform = {};
    #variables = null;
    #savedElements = null;
    #videoRecorder = null;
    #functions = null;

    #status = 'pending';
    #usedSelectors = '';
    #errorDetails = '';

    #condition = null;

    #originalBorderCSS = '';
    #hideKeyboard = false;
    #takeSnapshot = false;

    constructor(sequence, step) {
        this.#sequence = sequence;
        this.#command = step.command;
        this.#selectors = step.selectors;
        this.#namedElement = step.namedElement;
        this.#position = step.position ?? -1;
        this.#value = step.value;
        this.#operator = step.operator;
        this.#condition = step.condition ? new TestCondition(step.condition) : null;

        this.#build();
        this.#isValid();
    }

    //#region getters-setters

    get command() {
        return this.#command;
    }

    get selectors() {
        return this.#selectors;
    }

    get namedElement() {
        return this.#namedElement;
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

    get usedSelectors() {
        return this.#usedSelectors;
    }

    get errorDetails() {
        return this.#errorDetails;
    }

    get variables() {
        return this.#variables;
    }

    get savedElements() {
        return this.#savedElements;
    }

    get functions() {
        return this.#functions;
    }

    get conf() {
        return this.#session?.runConf;
    }

    get session() {
        return this.#session;
    }

    get hideKeyboard() {
        return this.#hideKeyboard;
    }

    set hideKeyboard(value) {
        this.#hideKeyboard = value;
    }

    get takeSnapshot() {
        return this.#takeSnapshot;
    }

    set takeSnapshot(value) {
        this.#takeSnapshot = value;
    }

    get namedElementOrUsedSelectorsComment() {
        return `${this.namedElement ? 'named element [' + this.namedElement + ']' : 'selectors [' + this.usedSelectors + ']'}`;
    }

    //#endregion

    //#region  validation

    #isValid() {
        if (!this.#command) {
            throw new TestDefinitionError(`Command is required for step ${this.#sequence}`);
        }

        if (!StepsCommands.commands.includes(this.#command)) {
            throw new TestDefinitionError(`Command ${this.#command} is not a valid one - step ${this.#sequence}`);
        }

        if (StepsCommands.RequiresSelector(this.#command) && !this.#selectors && this.#selectors.length === 0) {
            throw new TestDefinitionError(`Selector is required for step ${this.#sequence}`);
        }

        if (StepsCommands.RequiresValue(this.#command) && !this.#value) {
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
            try {
                this.#condition.isValid();
            } catch (error) {
                throw new TestDefinitionError(
                    `Condition for step ${this.#sequence} is not valid due to condition ${error.message}`
                );
            }
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

    //#region highlight & video

    async addFrameToVideo(forced) {
        if (this.#videoRecorder && (this.takeSnapshot || forced)) {
            await this.#videoRecorder.addFrame();
        }
    }

    async highlightElement(driver, item) {
        if (!item || item === 'noItem' || this.#session.type !== 'web') {
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
        } catch {
            console.log('Could not be highlighted');
        }
    }

    async revertElement(driver, item) {
        if (!item || item === 'noItem' || !this.#originalBorderCSS || this.#session.type !== 'web') {
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

    //#endregion

    //#region run

    async run(session, functions, variables, savedElements, videoRecorder) {
        this.#session = session;
        this.#functions = functions;
        this.#variables = variables;
        this.#savedElements = savedElements;
        this.#videoRecorder = videoRecorder;

        try {
            await this.doHideKeyboard(session.driver);

            if (this.#condition) {
                let conditionResult = await this.#condition.evaluate(session.driver, variables, session.runConf);
                if (!conditionResult) {
                    this.#status = 'skipped';
                    console.log(`TestStep::Condition for step ${this.#sequence} was not met - step skipped`);
                    return true;
                }
            }

            const item = StepsCommands.RequiresItem(this.#command) ? await this.selectItem(session.driver) : 'noItem';
            if (!item) {
                throw new TestItemNotFoundError(`Item with selectors [${this.#usedSelectors}]  not found`);
            }

            await this.highlightElement(session.driver, item);

            await this.execute(session.driver, item);

            await this.addFrameToVideo();

            await this.revertElement(session.driver, item);
        } catch (error) {
            this.#status = 'failed';
            this.#errorDetails = `${error.message}`;

            await this.addFrameToVideo();

            return false;
        }

        return true;
    }

    async selectItem(driver) {
        if (this.savedElements && this.#namedElement && this.savedElements[this.#namedElement]) {
            return this.savedElements[this.#namedElement];
        }

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
                if (!item || item.error) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        item = await driver.$(selector);
                    }
                }
            } else {
                const items = await driver.$$(selector);
                if (!items || items.error) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        item = await driver.$$(selector);
                    }
                }
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

    async execute(driver, item) {
        console.log(`Execute method is not implemented - ${driver} - ${item}`);
        throw new TestRunnerError('Execute method is not implemented');
    }

    //#endregion

    //#region utils

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

    async doHideKeyboard(driver) {
        if (this.session.type == 'mobile' && this.hideKeyboard) {
            const isKeyBoaordShown = await driver.isKeyboardShown();
            if (isKeyBoaordShown) {
                await driver.hideKeyboard();
                return true;
            }
        }

        return false;
    }

    //#endregion
}

module.exports = BaseStep;
