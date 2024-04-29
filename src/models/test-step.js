const { TestDefinitionError, TestItemNotFoundError, TestRunnerError } = require('../helpers/test-errors');

class TestStep {
    #sequence = 0;
    #command = '';
    #selectors = null;
    #position = -1;
    #value = null;

    #selectorsPerPlatform = {};

    #status = 'pending';
    #errorDetails = '';

    static #commands = [
        'pause',
        'click',
        'multiple-clicks',
        'set-value',
        'scroll-up',
        'scroll-down',
        'press-key',
        'wait-for-exist',
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
        'scroll-down'
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

    async run(driver) {
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
            const selector = selectors[i];
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
        await item.setValue(this.#value);
    }

    async #pressKey(driver, key) {
        // Implement press key logic
        await driver.pressKeyCode(key);
    }

    async #waitForExist(driver) {
        // Implement wait for exist logic
        let timeout = this.#value ?? 5000;
        await driver.waitUntil(
            async () => {
                let item = await this.#selectItem(driver);
                return !item ? false : true;
            },
            { timeout: timeout, interval: 1000 }
        );
        //await driver.waitForExist(this.#selectors[0], this.#value);
    }

    async #verticalScroll(driver, down = true) {
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

        const scrollEvt = this.#value > 1 ? this.#value : 1;
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
