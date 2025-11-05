import { TestDefinitionError, TestItemNotFoundError, TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables, prepareLocalScript } from '../../helpers/utils';
import TestCondition from './test-condition';
import { SessionConfiguration, TestStep, ExtendedBrowser } from '../../types';
import { VideoRecorder } from '../../helpers/video-recorder';
import StepsCommands from './abc-steps-commands';

const vmRun = require('@danielyaghil/vm-helper');

abstract class BaseStep {
    private session: SessionConfiguration | null = null;
    private readonly sequence: number = 0;
    private readonly command: string = '';
    private readonly selectors: string[] = [];
    private readonly namedElement: string = '';
    private readonly position: number = -1;
    private value: string | null = null;
    private readonly operator: string | null = null;
    private variables: Record<string, any> | null = null;
    private savedElements: Record<string, any> | null = null;
    private videoRecorder: VideoRecorder | null = null;
    private videoBaseStep: string = '';
    private functions: Record<string, any> | null = null;
    private apis: Record<string, any> | null = null;
    private status: string = 'pending';
    private usedSelectors: string = '';
    private errorDetails: string = '';
    private condition: TestCondition | null = null;
    private originalBorderCSS: any = '';
    private hideKeyboard: boolean = false;
    private takeSnapshot: boolean = false;
    private readonly rawData: TestStep;

    constructor(sequence: number, step: TestStep) {
        this.sequence = sequence;
        this.command = step.command;
        this.selectors = step.selectors || [];
        this.namedElement = step.namedElement || '';
        this.position = step.position ?? -1;
        this.value = step.value || null;
        this.operator = step.operator || null;
        this.condition = step.conditions && step.conditions.length > 0 ? new TestCondition(step.conditions[0]) : null;

        // Store the original step configuration
        this.rawData = { ...step };

        this.cleanSelectors();
        this.isValid();
    }

    get getRawData(): TestStep {
        return this.rawData;
    }

    get getSequence(): number {
        return this.sequence;
    }

    get getCommand(): string {
        return this.command;
    }

    get getSelectors(): string[] {
        return this.selectors;
    }

    get getNamedElement(): string {
        return this.namedElement;
    }

    get getValue(): string | null {
        return this.value;
    }

    set setValue(value: string | null) {
        this.value = value;
    }

    get getStatus(): string {
        return this.status;
    }

    get getOperator(): string | null {
        return this.operator;
    }

    get getUsedSelectors(): string {
        return this.usedSelectors;
    }

    get getErrorDetails(): string {
        return this.errorDetails;
    }

    get getVariables(): Record<string, any> | null {
        return this.variables;
    }

    set setVariables(value: Record<string, any> | null) {
        this.variables = value;
    }

    get getSavedElements(): Record<string, any> | null {
        return this.savedElements;
    }

    protected set setSavedElements(value: Record<string, any> | null) {
        this.savedElements = value;
    }

    get getFunctions(): Record<string, any> | null {
        return this.functions;
    }

    get getApis(): Record<string, any> | null {
        return this.apis;
    }

    get getConf(): any {
        return (this.session as any)?.runConf;
    }

    get getSession(): SessionConfiguration | null {
        return this.session;
    }

    get getHideKeyboard(): boolean {
        return this.hideKeyboard;
    }

    set setHideKeyboard(value: boolean) {
        this.hideKeyboard = value;
    }

    get getTakeSnapshot(): boolean {
        return this.takeSnapshot;
    }

    set setTakeSnapshot(value: boolean) {
        this.takeSnapshot = value;
    }

    get getNamedElementOrUsedSelectorsComment(): string {
        return `${this.namedElement ? 'named element [' + this.namedElement + ']' : 'selectors [' + this.usedSelectors + ']'}`;
    }

    get getVideoRecorder(): VideoRecorder | null {
        return this.videoRecorder;
    }

    get getVideoBaseStep(): string {
        return this.videoBaseStep;
    }

    private isValid(): boolean {
        if (!this.command) {
            throw new TestDefinitionError(`Command is required for step ${this.sequence}`);
        }

        if (!StepsCommands.commands.includes(this.command)) {
            throw new TestDefinitionError(`Command ${this.command} is not a valid one - step ${this.sequence}`);
        }

        if (StepsCommands.RequiresSelector(this.command) && (!this.selectors || this.selectors.length === 0)) {
            throw new TestDefinitionError(`Selector is required for step ${this.sequence}`);
        }

        if (StepsCommands.RequiresValue(this.command) && !this.value) {
            throw new TestDefinitionError(`Value is required for step ${this.sequence}`);
        }

        if (this.command === 'execute-script') {
            if (!this.operator || this.operator === 'sync') {
                if (!this.value?.includes('return')) {
                    throw new TestDefinitionError(
                        `ExecuteScript::Script for step ${this.sequence} should contain "return" to indicate to the system the script has completed and with what output`
                    );
                }
            } else if (this.operator !== 'local') {
                throw new TestDefinitionError(
                    `ExecuteScript::Script for step ${this.sequence} has invalid operator "${this.operator}" (should be only 'sync', 'async' or 'local')`
                );
            }
        }

        if (this.condition) {
            try {
                this.condition.isValid();
            } catch (error) {
                throw new TestDefinitionError(
                    `Condition for step ${this.sequence} is not valid due to condition ${(error as Error).message}`
                );
            }
        }

        return true;
    }

    private cleanSelectors(): void {
        // clean selectors - backward compatibility
        if (this.selectors) {
            for (let i = 0; i < this.selectors.length; i++) {
                let selector = this.selectors[i];
                let selectorParts = selector.split('|||');
                if (selectorParts.length > 1) {
                    this.selectors[i] = selectorParts[1].trim();
                }
            }
        }
    }

    async addFrameToVideo(forced?: boolean): Promise<void> {
        if (this.videoRecorder && (this.takeSnapshot || forced)) {
            await this.videoRecorder.addFrame();
        }
    }

    async highlightElement(driver: ExtendedBrowser, item: any): Promise<void> {
        if (!item || item === 'noItem' || (this.session as any)?.type !== 'web') {
            return;
        }

        if (!(await item.isDisplayed())) {
            return;
        }

        try {
            this.originalBorderCSS = await item.getCSSProperty('border');
            await driver.execute((el: any) => {
                let elt = el;
                while (elt.parentNode && elt.parentNode.children.length === 1) {
                    elt = elt.parentNode;
                }
                elt.style.border = '3px solid orangered';
            }, item);
        } catch {
            console.log(`Could not be highlighted: ${JSON.stringify(item)}`);
        }
    }

    async revertElement(driver: ExtendedBrowser, item: any): Promise<void> {
        if (!item || item === 'noItem' || !this.originalBorderCSS || (this.session as any)?.type !== 'web') {
            return;
        }

        try {
            if (!(await item.isExisting()) || !(await item.isDisplayed())) {
                return;
            }

            await driver.execute(
                (el: any, css: string) => {
                    let elt = el;
                    while (elt.parentNode && elt.parentNode.children.length === 1) {
                        elt = elt.parentNode;
                    }
                    elt.style.border = css;
                },
                item,
                this.originalBorderCSS.value
            );
        } catch {
            console.log(`Could not revert highlight: ${JSON.stringify(item)}`);
        } finally {
            this.originalBorderCSS = '';
        }
    }

    async run(
        session: SessionConfiguration,
        functions: Record<string, any>,
        apis: Record<string, any>,
        variables: Record<string, any>,
        savedElements: Record<string, any>,
        videoRecorder?: VideoRecorder,
        videoBaseStep: string = ''
    ): Promise<boolean> {
        this.session = session;
        this.functions = functions;
        this.apis = apis;
        this.variables = variables;
        this.savedElements = savedElements;
        this.videoRecorder = videoRecorder || null;
        this.videoBaseStep = videoBaseStep;

        try {
            if (this.condition) {
                let conditionResult = await this.condition.evaluate(
                    session.driver,
                    variables,
                    (session as any).runConf
                );
                if (!conditionResult) {
                    this.status = 'skipped';
                    return true;
                }
            }

            const item = StepsCommands.RequiresItem(this.command) ? await this.selectItem(session.driver) : 'noItem';
            if (!item) {
                if (this.namedElement) {
                    throw new TestItemNotFoundError(
                        `Item with named element [${this.namedElement}] not found - check previous steps`
                    );
                } else {
                    throw new TestItemNotFoundError(`Item with selectors [${this.usedSelectors}] not found`);
                }
            }

            await this.highlightElement(session.driver, item);

            await this.execute(session.driver, item);

            await this.addFrameToVideo();

            await this.revertElement(session.driver, item);
        } catch (error) {
            this.status = 'failed';
            this.errorDetails = `${(error as Error).message}`;

            await this.addFrameToVideo();

            return false;
        }

        return true;
    }

    async selectItem(driver: ExtendedBrowser): Promise<any> {
        if (this.namedElement) {
            if (this.savedElements && this.savedElements[this.namedElement]) {
                const saved = this.savedElements[this.namedElement];
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
        let selectors = this.selectors;
        if (!selectors || selectors.length === 0) {
            return null;
        }

        let item: any = null;
        this.usedSelectors = '';
        for (let i = 0; i < selectors.length; i++) {
            const selector = replaceVariables(selectors[i], this.variables || {});
            if (this.usedSelectors.length > 0) {
                this.usedSelectors += ',';
            }
            this.usedSelectors += `"${selector}"`;

            if (this.position === -1) {
                item = await driver.$(selector);
                if (!item || item.error) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        item = await driver.$(selector);
                    }
                }
            } else {
                const items = await driver.$$(selector);
                if (!items || (items as any).error) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        item = await driver.$$(selector);
                    }
                }
                if (items && !(items as any).error && items.length > this.position) {
                    item = items[this.position];
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

    abstract execute(driver: ExtendedBrowser, item: any): Promise<void>;

    async executeScript(script: string, driver: ExtendedBrowser): Promise<any> {
        try {
            if (this.operator === 'sync') {
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this.sequence} failed`);
                }
                console.log(
                    `ExecuteScript::Script: driver script for step ${this.sequence} succeeded: ${JSON.stringify(result)}`
                );
                return result;
            } else {
                const localScript = prepareLocalScript(script);
                const result = await vmRun(localScript, this.variables);
                if (!result || !result.success) {
                    throw new TestRunnerError(
                        `ExecuteScript::Script: local script for step ${this.sequence} failed ${result.error}`
                    );
                }
                console.log(
                    `ExecuteScript::Script: local script for step ${this.sequence} succeeded: ${JSON.stringify(result)}`
                );
                return result.output;
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(
                    `ExecuteScript::Script: script for step ${this.sequence} failed with error ${error}`
                );
            }
        }
    }

    async doHideKeyboard(driver: ExtendedBrowser): Promise<boolean> {
        if ((this.session as any)?.type === 'mobile' && this.hideKeyboard) {
            const isKeyBoaordShown = await (driver as any).isKeyboardShown();
            if (isKeyBoaordShown) {
                await (driver as any).hideKeyboard();
                return true;
            }
        }

        return false;
    }
}

export = BaseStep;
