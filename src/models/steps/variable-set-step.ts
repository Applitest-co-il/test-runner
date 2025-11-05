import BaseStep = require('./base-step');
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep, ExtendedBrowser } from '../../types';

export default class VariableSetStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: ExtendedBrowser, _: any): Promise<void> {
        const value = this.getValue;
        if (!value) {
            throw new TestRunnerError('SetVariable::No value provided');
        }

        const varParts = value.split('|||');
        if (varParts.length < 1) {
            throw new TestRunnerError(
                `SetVariable::Invalid set variable value format "${value}" - format should be "<var name>|||<var value>"`
            );
        }

        const varName = varParts[0];
        let varValue: string | null = null;
        if (varParts.length == 2) {
            varValue = varParts[1];
        } else {
            const selectors = this.getSelectors;
            if (!selectors || selectors.length === 0) {
                throw new TestRunnerError(
                    `SetVariable::Selectors is required to set variable for "${varName}" if value do not contain it`
                );
            }
            let item = await this.selectItem(driver);
            if (!item) {
                throw new TestRunnerError(
                    `SetVariable::Item with ${this.getNamedElementOrUsedSelectorsComment} was not found and this could not set his value into variable "${varName}"`
                );
            }
            await this.highlightElement(driver, item);
            await this.addFrameToVideo();
            varValue = await item.getText();
            await this.revertElement(driver, item);
        }
        const variables = this.getVariables || {};
        variables[varName] = varValue;
    }
}
