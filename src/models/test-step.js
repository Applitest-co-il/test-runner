const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../helpers/test-errors');
const { replaceVariables, prepareLocalScript } = require('../helpers/utils');
const { checkAppIsInstalled } = require('../helpers/mobile-utils');
const TestCondition = require('./test-condition');
const vmRun = require('@danielyaghil/vm-helper');
var randomstring = require('randomstring');
const { Key } = require('webdriverio');

class TestStep {
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
        'set-variable-from-script',
        'generate-random-integer',
        'generate-random-string',

        //actions
        'click',
        'multiple-clicks',
        'click-coordinates',
        'set-value',
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
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'assert-is-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute'
    ];
    static #commandsRequireSelector = [
        ...TestStep.#commandsRequireItem,
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

    #requiresItem(command) {
        return TestStep.#commandsRequireItem.includes(command);
    }

    #requiresSelector(command) {
        return TestStep.#commandsRequireSelector.includes(command);
    }

    #requiresValue(command) {
        return TestStep.#commandsRequireValue.includes(command);
    }

    #isValid() {
        if (!this.#command) {
            throw new TestDefinitionError(`Command is required for step ${this.#sequence}`);
        }

        if (!TestStep.#commands.includes(this.#command)) {
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

    async #addFrameToVideo() {
        if (this.#videoRecorder) {
            await this.#videoRecorder.addFrame();
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

            const item = this.#requiresItem(this.#command) ? await this.#selectItem(driver) : 'noIem';
            if (!item) {
                throw new TestItemNotFoundError(`Item with selectors [${this.#usedSelectors}]  not found`);
            }

            switch (this.#command) {
                //generic
                case 'pause':
                    await this.#pause(driver);
                    break;
                case 'navigate':
                    await this.#navigate(driver);
                    break;

                //settings
                case 'toggle-location-services':
                    await this.#toggleLocationServices(driver);
                    break;
                case 'toggle-airplane-mode':
                    await this.#toggleAirplaneMode(driver);
                    break;
                // case 'set-google-account':
                //     await this.#setGoogleAccount(driver);
                //     break;
                case 'set-geolocation':
                    await this.#setGeoLocation(driver);
                    break;

                //variables
                case 'generate-random-integer':
                    await this.#generateRandomInteger();
                    break;
                case 'generate-random-string':
                    await this.#generateRandomString();
                    break;
                case 'set-variable':
                    await this.#setVariable(driver);
                    break;
                case 'set-variable-from-script':
                    await this.#setVariableFromScript(driver);
                    break;

                //actions
                case 'click':
                    await this.#click(item);
                    break;
                case 'multiple-clicks':
                    await this.#multipleClicks(item);
                    break;
                case 'click-coordinates':
                    await this.#clickCoordinates(driver);
                    break;
                case 'set-value':
                    await this.#setValue(item);
                    break;
                case 'press-key':
                    await this.#pressKey(driver);
                    break;
                case 'scroll-up':
                    await this.#scrollUp(driver);
                    break;
                case 'scroll-down':
                    await this.#scrollDown(driver);
                    break;
                case 'scroll-up-to-element':
                    await this.#scrollUpToElement(driver);
                    break;
                case 'scroll-down-to-element':
                    await this.#scrollDownToElement(driver);
                    break;
                case 'scroll-up-from-element':
                    await this.#scrollUpFromElement(driver, item);
                    break;
                case 'scroll-down-from-element':
                    await this.#scrollDownFromElement(driver, item);
                    break;
                case 'scroll-right':
                    await this.#scrollRight(driver, null, false);
                    break;
                case 'scroll-left':
                    await this.#scrollLeft(driver, null, true);
                    break;
                case 'scroll-right-from-element':
                    await this.#scrollRightFromElement(driver, item);
                    break;
                case 'scroll-left-from-element':
                    await this.#scrollLeftFromElement(driver, item);
                    break;
                case 'execute-script':
                    await this.#executeScript(driver);
                    break;
                case 'perform-actions':
                    await this.#performActions(driver);
                    break;

                //assertions
                case 'wait-for-exist':
                    await this.#waitForExist(driver);
                    break;
                case 'wait-for-not-exist':
                    await this.#waitForNotExist(driver);
                    break;
                case 'assert-is-displayed':
                    await this.#assertIsDisplayed(item);
                    break;
                case 'assert-is-not-displayed':
                    await this.#assertIsNotDisplayed(driver);
                    break;
                case 'assert-text':
                    await this.#assertText(item);
                    break;
                case 'assert-number':
                    await this.#assertNumber(item);
                    break;
                case 'assert-css-property':
                    await this.#assertCssProperty(item);
                    break;
                case 'assert-attribute':
                    await this.#assertAttribute(item);
                    break;
                case 'assert-app-installed':
                    await this.#assertAppInstalled(driver);
                    break;

                //default
                default:
                    this.#errorDetails = `Command ${this.#command} is not a valid one`;
                    return false;
            }
        } catch (error) {
            this.#status = 'failed';
            this.#errorDetails = `${error.message}`;
            return false;
        }

        return true;
    }

    async #selectItem(driver) {
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

    async #pause(driver) {
        await driver.pause(this.#value);
    }

    async #navigate(driver) {
        const url = replaceVariables(this.#value, this.#variables);

        if (this.#operator === 'new') {
            await driver.newWindow(url);
            return;
        } else {
            await driver.url(url);
        }
    }

    async #click(item) {
        // Implement click logic
        await item.click();
    }

    async #multipleClicks(item) {
        // Implement multiple clicks logic
        for (let i = 0; i < this.#value; i++) {
            await item.click();
        }
    }

    async #setValue(item) {
        // Implement set value logic
        const actualValue = replaceVariables(this.#value, this.#variables);
        await item.setValue(actualValue);
    }

    async #pressKey(driver) {
        // Implement press key logic
        let key = parseInt(this.#value);
        await driver.pressKeyCode(key);
    }

    async #waitForExist(driver) {
        // Implement wait for exist logic
        let timeout = this.#value ? parseInt(this.#value) : 5000;
        try {
            let that = this;
            await driver.waitUntil(
                async () => {
                    let item = await that.#selectItem(driver);
                    if (!item) {
                        await this.#addFrameToVideo();
                        return false;
                    } else {
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch (e) {
            throw new TestRunnerError(
                `Element with selector [${this.#usedSelectors}] did not appear on screen up to ${timeout}ms`
            );
        }
    }
    async #waitForNotExist(driver) {
        // Implement wait for not exist logic
        let timeout = this.#value ? parseInt(this.#value) : 5000;
        try {
            let that = this;
            await driver.waitUntil(
                async () => {
                    let item = await that.#selectItem(driver);
                    if (item) {
                        await this.#addFrameToVideo();
                        return false;
                    } else {
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch (e) {
            throw new TestRunnerError(
                `Element with selector [${this.#usedSelectors}] did not disappear off screen up to ${timeout}ms`
            );
        }
    }

    //#region vertical scroll actions

    async #verticalScroll(driver, originItem, down = true) {
        const count = this.#value ? parseInt(this.#value) : 1;

        const startPercentage = originItem ? 0 : down ? 0.85 : 0.2;
        const endPercentage = originItem ? 0.3 : down ? 0.2 : 0.85;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorX = originItem ? 0 : width * anchorPercentage;
        const startY = originItem ? 0 : height * startPercentage;
        const endY = height * endPercentage;
        const fixedScroll = down ? -endY : endY;
        const scrollY = originItem ? fixedScroll : endY - startY;

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            if (this.#conf.runType == 'web') {
                const actualScrollY = -scrollY;

                await driver
                    .action('wheel')
                    .scroll({ origin: origin, deltaX: anchorX, deltaY: actualScrollY })
                    .pause(10)
                    .perform();
            } else {
                await driver
                    .action('pointer', {
                        parameters: { pointerType: 'touch' }
                    })
                    .move({ origin: origin, x: anchorX, y: startY })
                    .down()
                    .pause(10)
                    .move({ origin: 'pointer', duration: scrollDuration, x: 0, y: scrollY })
                    .pause(10)
                    .up()
                    .pause(10)
                    .perform();
            }
            await this.#addFrameToVideo();
            console.log(`VerticalScroll::Scrolled: ${down ? 'down' : 'up'} - iteration: ${i} - Y: ${scrollY}px`);
        }
        return;
    }

    async #scrollUp(driver) {
        await this.#verticalScroll(driver, null, false);
    }

    async #scrollDown(driver) {
        await this.#verticalScroll(driver, null, true);
    }

    async #scrollUpFromElement(driver, item) {
        await this.#verticalScroll(driver, item, false);
    }

    async #scrollDownFromElement(driver, item) {
        await this.#verticalScroll(driver, item);
    }

    async #scrollUpOrDownToElement(driver, down = true) {
        let count = 0;
        let maxCount = this.#value ? parseInt(this.#value) : 1;
        this.#value = 1;

        let item = null;
        while (count <= maxCount) {
            item = await this.#selectItem(driver);
            if (!item) {
                await this.#verticalScroll(driver, null, down);
            } else {
                break;
            }
            count++;
        }
        if (!item) {
            throw new TestRunnerError(
                `ScrollToElement::Item with selectors [${this.#usedSelectors}] was not found after scrolling ${maxCount} times`
            );
        }
    }

    async #scrollDownToElement(driver) {
        await this.#scrollUpOrDownToElement(driver);
    }

    async #scrollUpToElement(driver) {
        await this.#scrollUpOrDownToElement(driver, false);
    }

    //#endregion

    //#region horizontal scroll actions

    async #horizontalScroll(driver, originItem, left = true) {
        const count = this.#value ? parseInt(this.#value) : 1;

        const startPercentage = originItem ? 0 : left ? 0.1 : 0.9;
        const endPercentage = originItem ? 0.3 : left ? 0.9 : 0.1;
        const anchorPercentage = 0.5;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const origin = originItem ? originItem : 'viewport';
        const anchorY = originItem ? 0 : height * anchorPercentage;
        const startX = originItem ? 0 : width * startPercentage;
        const endX = width * endPercentage;
        const fixedScroll = left ? -endX : endX;
        const scrollX = originItem ? fixedScroll : endX - startX;
        const pointerType = this.#conf.runType == 'mobile' ? 'touch' : 'mouse';

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            await driver
                .action('pointer', {
                    parameters: { pointerType: pointerType }
                })
                .move({ origin: origin, x: startX, y: anchorY })
                .down()
                .pause(10)
                .move({ origin: 'pointer', duration: scrollDuration, x: scrollX, y: 0 })
                .pause(10)
                .up()
                .pause(10)
                .perform();
            await this.#addFrameToVideo();
        }
        return;
    }

    async #scrollRight(driver) {
        await this.#horizontalScroll(driver, null, false);
    }

    async #scrollLeft(driver) {
        await this.#horizontalScroll(driver, null, true);
    }

    async #scrollRightFromElement(driver, item) {
        await this.#horizontalScroll(driver, item, false);
    }

    async #scrollLeftFromElement(driver, item) {
        await this.#horizontalScroll(driver, item, true);
    }

    //#endregion

    //#region action

    async #clickCoordinates(driver) {
        const params = this.#value.split('|||');
        if (params.length < 2 || params.length > 3) {
            throw new TestRunnerError(
                `ClickCoordinates::Invalid coordinates value format "${this.#value}" - format should be "<x>|||<y>|||<duration>"`
            );
        }

        let x = 0;
        let y = 0;
        let duration = params.length === 3 ? parseInt(params[2]) : 10;

        if (params[0].includes('%') || params[1].includes('%')) {
            const { width, height } = await driver.getWindowSize();

            if (params[0].includes('%')) {
                x = parseInt(params[0].replace('%', '')) * width * 0.01;
            } else {
                x = parseInt(params[0]);
            }
            if (params[1].includes('%')) {
                y = parseInt(params[1].replace('%', '')) * height * 0.01;
            } else {
                y = parseInt(params[1]);
            }
        } else {
            x = parseInt(params[0]);
            y = parseInt(params[1]);
        }

        const pointerType = this.#conf.runType == 'mobile' ? 'touch' : 'mouse';

        if (isNaN(x) || isNaN(y)) {
            throw new TestRunnerError(
                `ClickCoordinates::Coordinates should be numbers in "${this.#value}" - format should be "<x>|||<y>"`
            );
        }

        await driver
            .action('pointer', {
                parameters: { pointerType: pointerType }
            })
            .move({ origin: 'viewport', duration: 100, x: x, y: y })
            .pause(10)
            .down()
            .pause(duration)
            .up()
            .perform();
    }

    async #performActions(driver) {
        try {
            const json = JSON.parse(this.#value);

            const type = json.type;
            let typeParams = null;
            if (type == 'pointer') {
                typeParams = { pointerType: json.pointerType ?? 'mouse' };
            }

            const action = typeParams ? await driver.action(type, typeParams) : driver.action(type);
            const actions = json.actions;

            if (actions && Array.isArray(actions) && actions.length > 0) {
                switch (type) {
                    case 'pointer':
                        await this.#performPointerAction(driver, action, actions);
                        break;
                    case 'key':
                        await this.#performKeyAction(action, actions);
                        break;
                    case 'wheel':
                        await this.#performWheelAction(action, actions);
                        break;
                    default:
                        break;
                }
            } else {
                throw new TestRunnerError(`PerformAction::Actions are required and should be an array of actions`);
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(`PerformAction::Failed to apply action" - ${error.message}`);
            }
        }
    }

    async #performWheelAction(actionObj, actions) {
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                switch (action.command) {
                    case 'scroll':
                        await actionObj.scroll({
                            deltaX: action.deltaX ?? 0,
                            deltaY: action.deltaY ?? 0,
                            duration: action.duration ?? 100
                        });
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        console.error(`PerformWheelAction::Invalid wheel action command "${action.command}"`);
                        break;
                }
            }
            await actionObj.perform();
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform wheel action  "${this.#value}" - ${error.message}`
            );
        }
    }

    async #performKeyAction(actionObj, actions) {
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let key = Key[action.key] ? Key[action.key] : action.key;
                switch (action.command) {
                    case 'down':
                        await actionObj.down(key);
                        break;
                    case 'up':
                        await actionObj.up(key);
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        console.error(`PerformKeyAction::Invalid key action command "${action.command}"`);
                }
            }
            await actionObj.perform();
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform key action  "${this.#value}" - ${error.message}`
            );
        }
    }

    async #performPointerAction(driver, actionObj, actions) {
        try {
            let commandsCount = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let origin = 'viewport';
                commandsCount++;
                switch (action.command) {
                    case 'move':
                        if (action.origin) {
                            if (action.origin == 'pointer' || action.origin == 'viewport') {
                                origin = action.origin;
                            } else {
                                origin = await this.#selectItem(driver);
                                if (!origin) {
                                    throw new TestRunnerError(
                                        `PerformAction::Origin item was not found for action ${i}`
                                    );
                                }
                            }
                        }
                        await actionObj.move({
                            origin: origin,
                            duration: action.duration ?? 100,
                            x: action.x ?? 0,
                            y: action.y ?? 0
                        });
                        break;
                    case 'down':
                        await actionObj.down(action.button ?? 'left');
                        break;
                    case 'up':
                        await actionObj.up(action.button ?? 'left');
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        console.error(`PerformPointerAction::Invalid pointer action command "${action.command}"`);
                        break;
                }

                if (action.command == 'up') {
                    await driver.pause(300);
                    await actionObj.perform();
                    actionObj.sequence = [];
                    commandsCount = 0;
                }
            }

            if (commandsCount > 0) {
                await actionObj.perform();
            }
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform pointer action  "${this.#value}" - ${error.message}`
            );
        }
    }

    //#endregion

    async #generateRandomInteger() {
        const randomParts = this.#value.split('|||');
        if (randomParts.length !== 3) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Invalid random value format "${this.#value}" - format should be "<var name>|||<min value>|||<max value>" `
            );
        }
        const varName = randomParts[0];
        const minValue = parseInt(randomParts[1]);
        const maxValue = parseInt(randomParts[2]);

        if (isNaN(minValue) || isNaN(maxValue)) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Min and Max values in "${this.#value}" should be numbers`
            );
        }
        if (minValue >= maxValue) {
            throw new TestRunnerError(
                `GenerateRandowInteger::Min value "${minValue}" should be less than Max value "${maxValue} - for reference value is "${this.#value}`
            );
        }

        const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        this.#variables[varName] = randomValue;
    }

    async #generateRandomString() {
        const randomParts = this.#value.split('|||');
        if (randomParts.length !== 3) {
            throw new TestRunnerError(
                `GenerateRandomString::Invalid random value format "${this.#value}" - format should be "<var name>|||<prefix>|||<max length>" `
            );
        }
        const varName = randomParts[0];
        const prefix = randomParts[1] != 'none' ? replaceVariables(randomParts[1], this.#variables) : '';
        const maxLen = randomParts[2] > 0 ? parseInt(randomParts[2]) : 10;

        if (isNaN(maxLen)) {
            throw new TestRunnerError(`GenerateRandowString::max words in "${this.#value}" should be a number`);
        }

        const randomValue = await randomstring.generate(maxLen);
        if (prefix) {
            this.#variables[varName] = `${prefix}-${randomValue}`;
        } else {
            this.#variables[varName] = randomValue;
        }
    }

    async #setVariable(driver) {
        const varParts = this.#value.split('|||');
        if (varParts.length < 1) {
            throw new TestRunnerError(
                `SetVariable::Invalid set variable value format "${this.#value}" - format should be "<var name>|||<var value>"`
            );
        }

        const varName = varParts[0];
        let varValue = null;
        if (varParts.length == 2) {
            varValue = varParts[1];
        } else {
            if (!this.#selectors || this.#selectors.length === 0) {
                throw new TestRunnerError(
                    `SetVariable::Selectors is required to set variable for "${varName}" if value do not contain it`
                );
            }
            let item = await this.#selectItem(driver);
            if (!item) {
                throw new TestRunnerError(
                    `SetVariable::Item with selectors [${this.#usedSelectors}] was not found and this could not set his value into variable "${varName}"`
                );
            }
            varValue = await item.getText();
        }
        this.#variables[varName] = varValue;
    }

    async #setVariableFromScript(driver) {
        const varParts = this.#value.split('|||');
        if (varParts.length < 2) {
            throw new TestRunnerError(
                `SetVariableFromScript::Invalid set variable value format "${this.#value}" - format should be "<var name>|||<script>"`
            );
        }

        const varName = varParts[0];
        const script = varParts[1];

        this.#value = script;
        const varValue = await this.#executeScript(driver);
        this.#variables[varName] = varValue;
    }

    async #executeScript(driver) {
        const script = `() => { ${replaceVariables(this.#value, this.#variables)} } `;
        try {
            if (this.#operator === 'sync') {
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this.#sequence} returns`);
                }
                console.log(`ExecuteScript::Script: script for step ${this.#sequence} returns ${result}`);
                return result;
            } else {
                const localScript = prepareLocalScript(script);
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

    async #toggleLocationServices(driver) {
        const value = replaceVariables(this.#value, this.#variables);
        try {
            if (driver.capabilities.platformName.toLowerCase() === 'android') {
                // Toggle location services using shell command
                const toggleCommand =
                    value === 'on' ? 'settings put secure location_mode 3' : 'settings put secure location_mode 0';
                await driver.execute('mobile: shell', { command: toggleCommand });
            }
        } catch (error) {
            throw new TestRunnerError(
                `ToggleLocationServices::Failed to toggle location services to "${value}". Error: ${error.message}`
            );
        }
    }

    async #toggleAirplaneMode(driver) {
        const value = replaceVariables(this.#value, this.#variables);

        try {
            if (value === 'on') {
                await driver.setNetworkConnection(1);
            } else {
                await driver.setNetworkConnection(6);
            }
        } catch (error) {
            throw new TestRunnerError(
                `ToggleAirplaneMode::Failed to toggle airplane mode to "${value}". Error: ${error.message}`
            );
        }
    }

    async #setGeoLocation(driver) {
        try {
            const value = replaceVariables(this.#value, this.#variables);
            const locationParts = value.split('|||');
            if (locationParts.length < 2) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude and longitude are required to set geo location - ${this.#value}`
                );
            }
            const latitude = locationParts[0];
            const longitude = locationParts[1];
            const altitude = locationParts.length == 3 ? locationParts[2] : 0;

            if (isNaN(latitude) || isNaN(longitude) || (altitude && isNaN(altitude))) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude, longitude and altitude should be numbers - ${this.#value}`
                );
            }

            if (this.#conf.platformName.toLowerCase() === 'android') {
                const isIoAppiumSettingAppInstalled = await checkAppIsInstalled(driver, 'io.appium.settings');
                if (!isIoAppiumSettingAppInstalled) {
                    console.log(
                        `SetGeoLocation::App "io.appium.settings" is not installed on the device - installing it now`
                    );
                    await driver.execute('mobile: install', './apps/settings_apk-debug.apk');
                    console.log(`SetGeoLocation::Installed app "io.appium.settings"`);
                }

                console.log(`SetGeoLocation::Allowing mock location for app "io.appium.settings"`);
                let command = 'appops set io.appium.settings android:mock_location allow';
                await driver.execute('mobile: shell', { command: command });

                console.log(
                    `SetGeoLocation::Starting location service for app "io.appium.settings" with latitude: ${latitude}, longitude: ${longitude}m altitude: ${altitude}`
                );
                command = `am start-foreground-service --user 0 -n io.appium.settings/.LocationService --es longitude ${longitude} --es latitude ${latitude} ${altitude != 0 ? '--es altitude ' + altitude : ''}`;
                await driver.execute('mobile: shell', { command: command });

                console.log(
                    `SetGeoLocation::Set geo location to latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}`
                );
            } else {
                throw new TestRunnerError('SetGeoLocation::Setting geo location is not supported on iOS yet');
            }
        } catch (error) {
            throw new TestRunnerError(`SetGeoLocation::Failed to set geo location. Error: ${error.message}`);
        }
    }

    //#region assertions

    async #assertIsDisplayed(item) {
        // Implement assert is displayed logic
        let isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(
                `AssertIsDisplayed::Item with selectors [${this.#usedSelectors}] was not found or is not displayed`
            );
        }
    }

    async #assertIsNotDisplayed(driver) {
        // Implement assert is displayed logic
        const item = await this.#selectItem(driver);
        if (!item) {
            throw new TestRunnerError(
                `AssertIsNotDisplayed::Item with selectors [${this.#usedSelectors}] was not found`
            );
        }
        let isDisplayed = await item.isDisplayed();
        if (isDisplayed) {
            throw new TestRunnerError(
                `AssertIsNotDisplayed::Item with selectors [${this.#usedSelectors}] is displayed`
            );
        }
    }

    async #assertText(item) {
        // Implement assert text logic
        const text = await item.getText();
        const actualValue = replaceVariables(this.#value, this.#variables);
        const operator = this.operator ? this.operator : '==';
        let result = false;
        switch (operator) {
            case '==':
                result = text === actualValue;
                break;
            case '!=':
                result = text != actualValue;
                break;
            case 'starts-with':
                result = text.startsWith(actualValue);
                break;
            case 'contains':
                result = text.indexOf(actualValue) >= 0;
                break;
            case 'not-contains':
                result = text.indexOf(actualValue) == -1;
                break;
            case 'ends-with':
                result = text.endsWith(actualValue);
                break;
        }
        if (!result) {
            throw new TestRunnerError(
                `AssertText::Text "${text}" does not match expected value "${actualValue}" using operator "${operator} on element with selectors [${this.#usedSelectors}]"`
            );
        }
    }

    async #assertNumber(item) {
        const text = await item.getText();
        const number = +text;
        if (isNaN(number)) {
            throw new TestRunnerError(
                `AssertNumber::Text "${text}" is not a valid number on element with selectors [${this.#usedSelectors}]`
            );
        }

        const actualValue = replaceVariables(this.#value, this.#variables);
        const actualNumber = +actualValue;
        if (isNaN(actualNumber)) {
            throw new TestRunnerError(`AssertNumber::Provided value "${this.value}" is not a valid number`);
        }

        let result = false;
        const operator = this.operator ? this.operator : '==';
        switch (operator) {
            case '==':
                result = number == actualNumber;
                break;
            case '!=':
                result = number != actualNumber;
                break;
            case '>':
                result = number > actualNumber;
                break;
            case '>=':
                result = number >= actualNumber;
                break;
            case '<':
                result = number < actualNumber;
                break;
            case '<=':
                result = number <= actualNumber;
                break;
        }

        if (!result) {
            throw new TestRunnerError(
                `AssertNumber::Text "${text}" does not match expected value "${actualValue}" using operator "${operator}" on element with selectors [${this.#usedSelectors}]`
            );
        }
    }

    async #assertCssProperty(item) {
        const propertyParts = this.#value.split('|||');
        if (propertyParts.length !== 2) {
            throw new TestRunnerError(
                `AssertCssProperty::Invalid value format "${this.#value}" - format should be "<property name>|||<expected value>" `
            );
        }
        const property = propertyParts[0];
        const expectedValue = propertyParts[1].replace(/\s+/g, '').toLowerCase();
        if (!property || !expectedValue) {
            throw new TestRunnerError(
                `AssertCssProperty::Property and expected value must be defined "${this.#value}" > "${property}" > "${expectedValue}"`
            );
        }

        // Fetch the actual value of the CSS property
        const actualValue = await item.getCSSProperty(property);
        const actualFormattedValue = actualValue.value.replace(/\s+/g, '').toLowerCase();

        // Compare the expected and actual values
        let result = false;
        const operator = this.operator ? this.operator : '==';
        switch (operator) {
            case '==':
                result = expectedValue == actualFormattedValue;
                break;
            case '!=':
                result = expectedValue != actualFormattedValue;
                break;
        }

        if (!result) {
            throw new TestRunnerError(
                `Assertion failed: CSS property '${property}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    }

    async #assertAttribute(item) {
        const attributeParts = this.#value.split('|||');
        if (attributeParts.length !== 2) {
            throw new TestRunnerError(
                `AssertAttribute::Invalid value format "${this.#value}" - format should be "<attribute name>|||<expected value>" `
            );
        }
        const attribute = attributeParts[0];
        const expectedValue = attributeParts[1].replace(/\s+/g, '').toLowerCase();
        if (!attribute || !expectedValue) {
            throw new TestRunnerError(`Attribute and expected value must be provided for 'assert-attribute'`);
        }

        // Fetch the actual value of the attribute
        const actualValue = await item.getAttribute(attribute);
        const actualFormattedValue = actualValue.replace(/\s+/g, '').toLowerCase();

        // Compare the expected and actual values
        let result = false;
        const operator = this.operator ? this.operator : '==';
        switch (operator) {
            case '==':
                result = expectedValue == actualFormattedValue;
                break;
            case '!=':
                result = expectedValue != actualFormattedValue;
                break;
        }

        if (!result) {
            throw new TestRunnerError(
                `Assertion failed: Attribute '${attribute}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    }

    async #assertAppInstalled(driver) {
        const app = replaceVariables(this.#value, this.#variables);
        try {
            const isInstalled = await checkAppIsInstalled(driver, app);
            if (!isInstalled) {
                throw new TestRunnerError(`AssertAppInstalled::App "${app}" is not installed`);
            }
        } catch (error) {
            throw new TestRunnerError(
                `AssertAppInstalled::Failed to check if app "${app}" is installed. Error: ${error.message}`
            );
        }
    }

    //#endregion

    //#endregion
}

module.exports = TestStep;
