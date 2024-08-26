const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../helpers/test-errors');
const { replaceVariables } = require('../helpers/utils');

class TestCondition {
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

    async evaluate(driver, variables) {
        switch (this.#type) {
            case 'exist':
                return await this.#existCheck(driver, variables);
            case 'script':
                return await this.#scriptCheck(driver, variables);
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

    async #scriptCheck(driver, variables) {
        let script = replaceVariables(this.#script, variables);
        let result = await driver.execute(script);
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

    #condition = null;

    static #commands = [
        //generic
        'pause',
        'navigate',

        //variables
        'set-variable',
        'set-variable-from-script',
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
        'execute-script',

        //assertions
        'wait-for-exist',
        'wait-for-not-exist',
        'assert-is-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute'
    ];
    static #commandsRequiredItem = [
        'click',
        'multiple-clicks',
        'set-value',
        'assert-is-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute'
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
        'execute-script',
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
        return TestStep.#commandsRequiredItem.includes(command);
    }

    #requiresValue(command) {
        return TestStep.#commandsRequiredValue.includes(command);
    }

    #isValid() {
        if (!this.#command) {
            throw new TestDefinitionError(`Command is required for step ${this.#sequence}`);
        }

        if (!TestStep.#commands.includes(this.#command)) {
            throw new TestDefinitionError(`Command ${this.#command} is not a valid one - step ${this.#sequence}`);
        }

        if (this.#requiresItem(this.#command) && (!this.#selectors || this.#selectors.length === 0)) {
            throw new TestDefinitionError(`Selectors is required for step ${this.#sequence}`);
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
            } else if (this.#operator === 'async') {
                if (!this.#value.includes('callback')) {
                    throw new TestDefinitionError(
                        `ExecuteAsyncScript::Script for step ${this.#sequence} should contain call to "callback" function with return value has paramter to indicate to the system the script has completed and with what output`
                    );
                }
            } else {
                throw new TestDefinitionError(
                    `ExecuteScript::Script for step ${this.#sequence} has invalid operator "${this.#operator} (should be only 'sync' or 'async')`
                );
            }
        }

        if (this.command === 'execute-async-script') {
            if (!this.#value.includes('callback')) {
                throw new TestDefinitionError(
                    `ExecuteAsyncScript::Script for step ${this.#sequence} should contain call to "callback" function with return value has paramter to indicate to the system the script has completed and with what output`
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

    async run(driver, variables) {
        this.#variables = variables;

        try {
            if (this.#condition) {
                let conditionResult = await this.#condition.evaluate(driver, variables);
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

                //variables
                case 'generate-random-integer':
                    await this.#generateRandomInteger();
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
                case 'execute-script':
                    await this.#executeScript(driver);
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
    async #waitForNotExist(driver) {
        // Implement wait for not exist logic
        let timeout = this.#value ? parseInt(this.#value) : 5000;
        try {
          let that = this;
          await driver.waitUntil(
            async () => {
              let item = await that.#selectItem(driver);
              return !item || item.error;
            },
            { timeout: timeout, interval: 1000 }
          );
        } catch (e) {
          throw new TestRunnerError(
            `Element with selector [${this.#usedSelectors}] did not disappear on screen up to ${timeout}ms`
          );
        }
      }

      async #assertCssProperty(item) {
        const property = this.#value.property;
        const expectedValue = this.#value.expectedValue.replace(/\s+/g, '').toLowerCase();
    
        if (!property || !expectedValue) {
            throw new TestDefinitionError(`Property and expected value must be provided for 'assert-css-property'`);
        }
    
        // Fetch the actual value of the CSS property
        const actualValue = await item.getCSSProperty(property);
        const actualFormattedValue = actualValue.value.replace(/\s+/g, '').toLowerCase();
    
        // Debugging information
        console.log(`Actual value: '${actualFormattedValue}', Expected value: '${expectedValue}'`);
    
        // Compare the expected and actual values
        if (actualFormattedValue !== expectedValue) {
            throw new TestRunnerError(
                `Assertion failed: CSS property '${property}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    
        console.log(`Assertion passed: CSS property '${property}' is '${expectedValue}'`);
    }

    async #assertAttribute(item) {
        const attribute = this.#value.attribute;
        const expectedValue = this.#value.expectedValue.replace(/\s+/g, '').toLowerCase();
    
        if (!attribute || !expectedValue) {
            throw new TestDefinitionError(`Attribute and expected value must be provided for 'assert-attribute'`);
        }
    
        // Fetch the actual value of the attribute
        const actualValue = await item.getAttribute(attribute);
        const actualFormattedValue = actualValue.replace(/\s+/g, '').toLowerCase();
    
        // Debugging information
        console.log(`Actual value: '${actualFormattedValue}', Expected value: '${expectedValue}'`);
    
        // Compare the expected and actual values
        if (actualFormattedValue !== expectedValue) {
            throw new TestRunnerError(
                `Assertion failed: Attribute '${attribute}' is '${actualFormattedValue}', expected '${expectedValue}'`
            );
        }
    
        console.log(`Assertion passed: Attribute '${attribute}' is '${expectedValue}'`);
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
        console.log(
            `Variables::Variables are ${JSON.stringify(this.#variables)} following addition of "${varName}" with value "${varValue}"`
        );
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
        console.log(
            `Variables::Variables are ${JSON.stringify(this.#variables)} following addition of "${varName}" with value "${varValue}"`
        );
    }

    async #executeScript(driver) {
        const script = replaceVariables(this.#value, this.#variables);
        try {
            if (this.#operator === 'async') {
                const asyncScript = `var callback = arguments[arguments.length - 1]; ${script};`;
                const result = await driver.executeAsync(asyncScript);
                if (!result) {
                    throw new TestRunnerError(`ExecuteAsyncScript::Script: script for step ${this.#sequence} returns`);
                }
                console.log(`ExecuteScript::Script: async script for step ${this.#sequence} returns ${result}`);
                return result;
            } else {
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this.#sequence} returns`);
                }
                console.log(`ExecuteScript::Script: script for step ${this.#sequence} returns ${result}`);
                return result;
            }
        } catch (error) {
            throw new TestRunnerError(
                `ExecuteScript::Script: script for step ${this.#sequence} failed with error ${error}`
            );
        }
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
