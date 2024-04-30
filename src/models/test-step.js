const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../helpers/test-errors');
const { replaceVariables } = require('../helpers/utils');

class TestStep {
    #sequence = 0;
    #command = '';
    #selectors = null;
    #position = -1;
    #value = null;

    #selectorsPerPlatform = {};
    #variables = null;

    #status = 'pending';
    #errorDetails = '';

    static #commands = [
        'pause',
        'click',
        'multiple-clicks',
        'set-value',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'press-key',
        'wait-for-exist',
        'generate-random-integer',
        'assert-is-displayed',
        'assert-text'
    ];
    static #commandsRequiredItem = ['click', 'multiple-clicks', 'set-value', 'assert-is-displayed', 'assert-text'];
    static #commandsRequiredValue = [
        'multiple-clicks',
        'set-value',
        'press-key',
        'assert-text',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'generate-random-integer'
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

    get errorDetails() {
        return this.#errorDetails;
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
                throw new TestItemNotFoundError(`Item with selectors [${this.#selectors.join(',')}]  not found`);
            }

            switch (this.#command) {
                case 'pause':
                    await this.#pause(driver);
                    break;
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
                    await this.#pressKey(driver, this.#value);
                    break;
                case 'wait-for-exist':
                    await this.#waitForExist(driver);
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
                case 'generate-random-integer':
                    await this.#generateRandomInteger();
                    break;
                case 'assert-is-displayed':
                    await this.#assertIsDisplayed(item);
                    break;
                case 'assert-text':
                    await this.#assertText(item);
                    break;
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
        for (let i = 0; i < selectors.length; i++) {
            const selector = replaceVariables(selectors[i], this.#variables);
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

    async #pressKey(driver, key) {
        // Implement press key logic
        await driver.pressKeyCode(key);
    }

    async #waitForExist(driver) {
        // Implement wait for exist logic
        let timeout = this.#value ?? 5000;
        let that = this;
        await driver.waitUntil(
            async () => {
                let item = await that.#selectItem(driver);
                return !item ? false : true;
            },
            { timeout: timeout, interval: 1000 }
        );
        //await driver.waitForExist(this.#selectors[0], this.#value);
    }

    async #verticalScroll(driver, count, down = true) {
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
        await this.#verticalScroll(driver, this.#value, false);
    }

    async #scrollDown(driver) {
        await this.#verticalScroll(driver, this.#value, true);
    }

    async #scrollToElement(driver, timeout, down = true) {
        const startTimeStamp = new Date().getTime();
        let timeSpan = 0;
        while (timeSpan < timeout) {
            let item = await this.#selectItem(driver);
            if (!item) {
                this.#verticalScroll(driver, 1, down);
            } else {
                break;
            }
            timeSpan = new Date().getTime() - startTimeStamp;
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
            throw new TestRunnerError(`Invalid random value format`);
        }
        const varName = randomParts[0];
        const minValue = parseInt(randomParts[1]);
        const maxValue = parseInt(randomParts[2]);

        const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        this.#variables[varName] = randomValue;
    }

    async #assertIsDisplayed(item) {
        // Implement assert is displayed logic
        let isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            throw new TestRunnerError(`Item is not displayed`);
        }
    }

    async #assertText(item) {
        // Implement assert text logic
        let text = await item.getText();
        if (text !== this.#value) {
            throw new TestRunnerError(`Text "${text}" does not match expected value "${this.#value}"`);
        }
    }

    //#endregion
}

module.exports = TestStep;
