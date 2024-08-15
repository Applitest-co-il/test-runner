const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../helpers/test-errors');
const { replaceVariables } = require('../helpers/utils');

class TestStep {
    #sequence = 0;
    #command = '';
    #selectors = [];
    #position = -1;
    #value = null;
    #operator = null;

    #selectorsPerPlatform = {};
    #variables = null;

    #status = 'pending';
    #usedSelectors = '';
    #errorDetails = '';

    static #commands = [
        //generic
        'pause',
        'toggle-location-services',

        //variables
        'set-variable',
        'generate-random-integer',

        //actions
        'click',
        'multiple-clicks',
        'set-value',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'press-key',

        //assertions
        'wait-for-exist',
        'assert-is-displayed',
        'assert-text',
        'assert-number'
    ];
    static #commandsRequiredItem = [
        'click',
        'multiple-clicks',
        'set-value',
        'assert-is-displayed',
        'assert-text',
        'assert-number'
    ];
    static #commandsRequiredValue = [
        'multiple-clicks',
        'set-value',
        'press-key',
        'assert-text',
        'assert-number',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'generate-random-integer',
        'toggle-location-services'
    ];

    constructor(sequence, step) {
        this.#sequence = sequence;
        this.#command = step.command;
        this.#selectors = step.selectors;
        this.#position = step.position ?? -1;
        this.#value = step.value;

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
        return TestStep.#commandsRequiredItem.includes(command);
    }

    #requiresValue(command) {
        return TestStep.#commandsRequiredValue.includes(command);
    }

    #isValid() {
        if (!this.#command) {
            throw new TestDefinitionError(`Command is required for step ${this.#sequence}`);
        }

        if (this.#requiresItem(this.#command) && (!this.#selectors || this.#selectors.length === 0)) {
            throw new TestDefinitionError(`Selectors is required for step ${this.#sequence}`);
        }

        if (this.#requiresValue(this.#command) && !this.#value) {
            throw new TestDefinitionError(`Value is required for step ${this.#sequence}`);
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

    async run(driver, variables) {
        this.#variables = variables;

        try {
            const item = this.#requiresItem(this.#command) ? await this.#selectItem(driver) : 'noIem';
            if (!item) {
                throw new TestItemNotFoundError(`Item with selectors [${this.#usedSelectors}]  not found`);
            }

            switch (this.#command) {
                //generic
                case 'pause':
                    await this.#pause(driver);
                    break;

                //variables
                case 'generate-random-integer':
                    await this.#generateRandomInteger();
                    break;
                case 'set-variable':
                    await this.#setVariable(driver);
                    break;

                //actions
                case 'click':
                    await this.#click(item);
                    break;
                case 'multiple-clicks':
                    await this.#multipleClicks(item);
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

                //assertions
                case 'wait-for-exist':
                    await this.#waitForExist(driver);
                    break;
                case 'assert-is-displayed':
                    await this.#assertIsDisplayed(item);
                    break;
                case 'assert-text':
                    await this.#assertText(item);
                    break;
                case 'assert-number':
                    await this.#assertNumber(item);
                    break;
                case 'toggle-location-services':  
                    await this.#toggleLocationServices(driver);
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
        // Implement pause logic
        await driver.pause(this.#value);
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
                    return !item ? false : true;
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch (e) {
            throw new TestRunnerError(
                `Element with selector [${this.#usedSelectors}] did not appear on screen up to ${timeout}ms`
            );
        }
    }

    async #verticalScroll(driver, down = true) {
        const count = this.#value ? parseInt(this.#value) : 1;
        const startPercentage = down ? 90 : 10;
        const endPercentage = down ? 10 : 90;
        const anchorPercentage = 50;
        const scrollDuration = 500;

        const { width, height } = await driver.getWindowSize();
        const density = (await driver.getDisplayDensity()) / 100;
        const anchor = (width * anchorPercentage) / 100;
        const startPoint = (height * startPercentage) / 100;
        const endPoint = (height * endPercentage) / 100;
        const direction = down ? -1 : 1;

        const scrollEvt = count > 1 ? count : 1;
        for (let i = 0; i < scrollEvt; i++) {
            await driver.performActions([
                {
                    type: 'pointer',
                    id: 'finger1',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', duration: 0, x: anchor, y: startPoint },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pause', duration: 100 },
                        {
                            type: 'pointerMove',
                            duration: scrollDuration,
                            origin: 'pointer',
                            x: 0,
                            y: direction * endPoint * density
                        },
                        { type: 'pointerUp', button: 0 },
                        { type: 'pause', duration: scrollDuration }
                    ]
                }
            ]);
        }
        return;
    }

    async #scrollUp(driver) {
        await this.#verticalScroll(driver, false);
    }

    async #scrollDown(driver) {
        await this.#verticalScroll(driver, true);
    }

    async #scrollToElement(driver, down = true) {
        let count = 0;
        let maxCount = this.#value ? parseInt(this.#value) : 1;
        while (count < maxCount) {
            let item = await this.#selectItem(driver);
            if (!item) {
                this.#verticalScroll(driver, 1, down);
            } else {
                break;
            }
            count++;
        }
    }

    async #scrollDownToElement(driver) {
        await this.#scrollToElement(driver, this.#value);
    }

    async #scrollUpToElement(driver) {
        await this.#scrollToElement(driver, this.#value, false);
    }

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

    async #assertIsDisplayed(item) {
        // Implement assert is displayed logic
        let isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(
                `AssertIsDisplayed::Item with selectors [${this.#usedSelectors}] was not found or is not displayed`
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

    async #toggleLocationServices(driver) {
        const value = replaceVariables(this.#value, this.#variables);
        const command = value === 'on'
            ? 'settings put secure location_providers_allowed +gps'
            : 'settings put secure location_providers_allowed -gps';

        try {
            await driver.execute('mobile: shell', { command });
        } catch (error) {
            throw new TestRunnerError(
                `ToggleLocationServices::Failed to toggle location services to "${value}". Error: ${error.message}`
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
        const operator = this.operator ? this.operator : '==';
        let result = false;
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

    //#endregion
}

module.exports = TestStep;