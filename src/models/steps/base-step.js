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

    #variables = null;
    #savedElements = null;
    #videoRecorder = null;
    #videoBaseStep = '';
    #functions = null;
    #apis = null;

    #status = 'pending';
    #usedSelectors = '';
    #errorDetails = '';

    #condition = null;

    #originalBorderCSS = '';
    #hideKeyboard = false;
    #takeSnapshot = false;

    #rawData = null;

    constructor(sequence, step) {
        this.#sequence = sequence;
        this.#command = step.command;
        this.#selectors = step.selectors;
        this.#namedElement = step.namedElement;
        this.#position = step.position ?? -1;
        this.#value = step.value;
        this.#operator = step.operator;
        this.#condition = step.condition ? new TestCondition(step.condition) : null;

        // Store the original step configuration
        this.#rawData = { ...step };

        this.#cleanSelectors();
        this.#isValid();
    }

    get rawData() {
        return this.#rawData;
    }

    get sequence() {
        return this.#sequence;
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

    set variables(value) {
        this.#variables = value;
    }

    get savedElements() {
        return this.#savedElements;
    }

    get functions() {
        return this.#functions;
    }

    get apis() {
        return this.#apis;
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

    get videoRecorder() {
        return this.#videoRecorder;
    }

    get videoBaseStep() {
        return this.#videoBaseStep;
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

    //#endregion

    //#region selectors

    #cleanSelectors() {
        // clean selectors - backward compatibility
        if (this.#selectors) {
            for (let i = 0; i < this.#selectors.length; i++) {
                let selector = this.#selectors[i];
                let selectorParts = selector.split('|||');
                if (selectorParts.length > 1) {
                    this.#selectors[i] = selectorParts[1].trim();
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

        if (!(await item.isDisplayed())) {
            return;
        }

        try {
            this.#originalBorderCSS = await item.getCSSProperty('border');
            await driver.execute((el) => {
                let elt = el;
                while (elt.parentNode && elt.parentNode.children.length == 1) {
                    elt = elt.parentNode;
                }
                elt.style.border = '3px solid orangered';
            }, item);
        } catch {
            console.log(`Could not be highlighted: ${JSON.stringify(item)}`);
        }
    }

    async revertElement(driver, item) {
        if (!item || item === 'noItem' || !this.#originalBorderCSS || this.#session.type !== 'web') {
            return;
        }

        try {
            if (!(await item.isExisting()) || !(await item.isDisplayed())) {
                return;
            }

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
        } catch {
            console.log(`Could not revert highlight: ${JSON.stringify(item)}`);
        } finally {
            this.#originalBorderCSS = '';
        }
    }

    //#endregion

    //#region run

    async run(session, functions, apis, variables, savedElements, videoRecorder, videoBaseStep = '') {
        this.#session = session;
        this.#functions = functions;
        this.#apis = apis;
        this.#variables = variables;
        this.#savedElements = savedElements;
        this.#videoRecorder = videoRecorder;
        this.#videoBaseStep = videoBaseStep;

        try {
            if (this.#condition) {
                let conditionResult = await this.#condition.evaluate(session.driver, variables, session.runConf);
                if (!conditionResult) {
                    this.#status = 'skipped';
                    return true;
                }
            }

            const item = StepsCommands.RequiresItem(this.#command) ? await this.selectItem(session.driver) : 'noItem';
            if (!item) {
                if (this.#namedElement) {
                    throw new TestItemNotFoundError(
                        `Item with named element [${this.#namedElement}] not found - check previous steps`
                    );
                } else {
                    throw new TestItemNotFoundError(`Item with selectors [${this.#usedSelectors}]  not found`);
                }
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
        if (this.#namedElement) {
            if (this.savedElements && this.savedElements[this.#namedElement]) {
                const saved = this.savedElements[this.#namedElement];
                if (saved && saved.isDisplayed()) {
                    return saved;
                } else {
                    this.doHideKeyboard(driver);
                    return saved;
                }
            } else {
                return null;
            }
        }

        // Implement item selection logic
        let selectors = this.#selectors;
        if (!selectors || selectors.length === 0) {
            return null;
        }

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

    async execute(_, __) {
        throw new TestRunnerError('Execute method is not implemented');
    }

    //#endregion

    //#region utils

    async executeScript(script, driver) {
        try {
            if (this.#operator === 'sync') {
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this.#sequence} failed`);
                }
                return result;
            } else {
                const localScript = prepareLocalScript(script);
                const result = await vmRun(localScript, this.#variables);
                if (!result || !result.success) {
                    throw new TestRunnerError(
                        `ExecuteScript::Script: local script for step ${this.#sequence} failed ${result.error}`
                    );
                }
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
