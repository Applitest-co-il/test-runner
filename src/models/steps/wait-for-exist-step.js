const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class WaitForExistStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        let timeout = this.value ? parseInt(this.value) : 5000;
        try {
            let that = this;
            await driver.waitUntil(
                async () => {
                    let item = await that.selectItem(driver);
                    if (!item) {
                        await that.addFrameToVideo();
                        return false;
                    } else {
                        await that.highlightElement(driver, item);
                        return true;
                    }
                },
                { timeout: timeout, interval: 1000 }
            );
        } catch (e) {
            throw new TestRunnerError(
                `Element with selector [${this.usedSelectors}] did not appear on screen up to ${timeout}ms`
            );
        }
    }
}

module.exports = WaitForExistStep;
