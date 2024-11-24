const BaseStep = require('./base-step');
const { TestRunnerError } = require('../../helpers/test-errors');

class VariableSetStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        const varParts = this.value.split('|||');
        if (varParts.length < 1) {
            throw new TestRunnerError(
                `SetVariable::Invalid set variable value format "${this.value}" - format should be "<var name>|||<var value>"`
            );
        }

        const varName = varParts[0];
        let varValue = null;
        if (varParts.length == 2) {
            varValue = varParts[1];
        } else {
            if (!this.selectors || this.selectors.length === 0) {
                throw new TestRunnerError(
                    `SetVariable::Selectors is required to set variable for "${varName}" if value do not contain it`
                );
            }
            let item = await this.selectItem(driver);
            if (!item) {
                throw new TestRunnerError(
                    `SetVariable::Item with selectors [${this.usedSelectors}] was not found and this could not set his value into variable "${varName}"`
                );
            }
            await this.highlightElement(driver, item);
            await this.addFrameToVideo();
            varValue = await item.getText();
            await this.revertElement(driver, item);
        }
        this.variables[varName] = varValue;
    }
}

module.exports = VariableSetStep;
