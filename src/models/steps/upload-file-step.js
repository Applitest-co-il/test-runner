const BaseStep = require('./base-step');

class UploadFileStep extends BaseStep {
    #valueUrl = '';
    #valueFilename = '';

    constructor(sequence, step) {
        super(sequence, step);
        this.#valueUrl = step.valueUrl || '';
        this.#valueFilename = step.valueFilename || '';

        this.takeSnapshot = true;
    }

    get valueUrl() {
        return this.#valueUrl;
    }

    get valueFilename() {
        return this.#valueFilename;
    }

    async execute(driver, item) {
        let actualValue = this.value;
        if (this.conf.farm !== 'local') {
            actualValue = await driver.uploadFile(actualValue);
        }

        const isDisplayed = await item.isDisplayed();
        if (!isDisplayed) {
            await driver.execute(
                // assign style to elem in the browser
                (el) => (el.style.display = 'block'),
                // pass in element so we don't need to query it again in the browser
                item
            );
            await item.waitForDisplayed();
        }
        await item.setValue(actualValue);
    }
}

module.exports = UploadFileStep;
