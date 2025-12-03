import { TestDefinitionError, TestItemNotFoundError, TestRunnerError } from '../../helpers/test-errors';
import { replaceVariables, prepareLocalScript } from '../../helpers/utils';
import { logger } from '../../helpers/log-service';
import TestCondition from './test-condition';
import { TestStep, RunSession } from '../../types';
import { VideoRecorder } from '../../helpers/video-recorder';
import StepsCommands from './abc-steps-commands';
import { Browser, ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';

import vmRun from '@danielyaghil/vm-helper';
import { TrApi } from '../api';
import { TrFunction } from '../function';

abstract class BaseStep {
    private _session: RunSession | null = null;
    private readonly _sequence: number = 0;
    private readonly _command: string = '';
    private readonly _selectors: string[] = [];
    private readonly _namedElement: string = '';
    private readonly _position: number = -1;
    private _value: string | null = null;
    private readonly _operator: string | null = null;
    private _variables: Record<string, string> | null = null;
    private _savedElements: Record<string, ChainablePromiseElement> | null = null;
    private _videoRecorder: VideoRecorder | null = null;
    private _videoBaseStep: string = '';
    private _functions: TrFunction[] | null = null;
    private _apis: TrApi[] | null = null;
    private _status: string = 'pending';
    private _usedSelectors: string = '';
    private _errorDetails: string = '';
    private _condition: TestCondition | null = null;
    private _originalBorderCSS: any = null;
    private _hideKeyboard: boolean = false;
    private _takeSnapshot: boolean = false;
    private readonly _rawData: TestStep;

    constructor(sequence: number, step: TestStep) {
        this._sequence = sequence;
        this._command = step.command;
        this._selectors = step.selectors || [];
        this._namedElement = step.namedElement || '';
        this._position = step.position ?? -1;
        this._value = step.value || null;
        this._operator = step.operator || null;
        this._condition = step.condition ? new TestCondition(step.condition) : null;

        // Store the original step configuration
        this._rawData = { ...step };

        this.cleanSelectors();
        this.isValid();
    }

    get session(): RunSession | null {
        return this._session;
    }

    set session(value: RunSession | null) {
        this._session = value;
    }

    get conf() {
        return this._session?.runConf;
    }

    get sequence(): number {
        return this._sequence;
    }

    get command(): string {
        return this._command;
    }

    get selectors(): string[] {
        return this._selectors;
    }

    get namedElement(): string {
        return this._namedElement;
    }

    get position(): number {
        return this._position;
    }

    get value(): string | null {
        return this._value;
    }

    set value(value: string | null) {
        this._value = value;
    }

    get operator(): string | null {
        return this._operator;
    }

    get variables(): Record<string, string> | null {
        return this._variables;
    }

    set variables(value: Record<string, string> | null) {
        this._variables = value;
    }

    get savedElements(): Record<string, ChainablePromiseElement> | null {
        return this._savedElements;
    }

    set savedElements(value: Record<string, ChainablePromiseElement> | null) {
        this._savedElements = value;
    }

    get videoRecorder(): VideoRecorder | null {
        return this._videoRecorder;
    }

    set videoRecorder(value: VideoRecorder | null) {
        this._videoRecorder = value;
    }

    get videoBaseStep(): string {
        return this._videoBaseStep;
    }

    set videoBaseStep(value: string) {
        this._videoBaseStep = value;
    }

    get functions(): TrFunction[] | null {
        return this._functions;
    }

    set functions(value: TrFunction[] | null) {
        this._functions = value;
    }

    get apis(): TrApi[] | null {
        return this._apis;
    }

    set apis(value: TrApi[] | null) {
        this._apis = value;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }

    get usedSelectors(): string {
        return this._usedSelectors;
    }

    set usedSelectors(value: string) {
        this._usedSelectors = value;
    }

    get errorDetails(): string {
        return this._errorDetails;
    }

    set errorDetails(value: string) {
        this._errorDetails = value;
    }

    get condition(): TestCondition | null {
        return this._condition;
    }

    get originalBorderCSS(): any {
        return this._originalBorderCSS;
    }

    set originalBorderCSS(value: any) {
        this._originalBorderCSS = value;
    }

    get hideKeyboard(): boolean {
        return this._hideKeyboard;
    }

    set hideKeyboard(value: boolean) {
        this._hideKeyboard = value;
    }

    get takeSnapshot(): boolean {
        return this._takeSnapshot;
    }

    set takeSnapshot(value: boolean) {
        this._takeSnapshot = value;
    }

    get rawData(): TestStep {
        return this._rawData;
    }

    get namedElementOrUsedSelectorsComment(): string {
        return `${this._namedElement ? 'named element [' + this._namedElement + ']' : 'selectors [' + this._usedSelectors + ']'}`;
    }

    private isValid(): boolean {
        if (!this._command) {
            throw new TestDefinitionError(`Command is required for step ${this._sequence}`);
        }

        if (!StepsCommands.commands.includes(this._command)) {
            throw new TestDefinitionError(`Command ${this._command} is not a valid one - step ${this._sequence}`);
        }

        if (
            StepsCommands.RequiresSelector(this._command) &&
            (!this._selectors || this._selectors.length === 0) &&
            !this._namedElement
        ) {
            throw new TestDefinitionError(`Selector is required for step ${this._sequence}`);
        }

        if (StepsCommands.RequiresValue(this._command) && !this._value) {
            throw new TestDefinitionError(`Value is required for step ${this._sequence}`);
        }

        if (this._command === 'execute-script') {
            if (!this._operator || this._operator === 'sync') {
                if (!this._value?.includes('return')) {
                    throw new TestDefinitionError(
                        `ExecuteScript::Script for step ${this._sequence} should contain "return" to indicate to the system the script has completed and with what output`
                    );
                }
            } else if (this._operator !== 'local') {
                throw new TestDefinitionError(
                    `ExecuteScript::Script for step ${this._sequence} has invalid operator "${this._operator}" (should be only 'sync', 'async' or 'local')`
                );
            }
        }

        if (this._condition) {
            try {
                this._condition.isValid();
            } catch (error) {
                throw new TestDefinitionError(
                    `Condition for step ${this._sequence} is not valid due to condition ${(error as Error).message}`
                );
            }
        }

        return true;
    }

    private cleanSelectors(): void {
        // clean selectors - backward compatibility
        if (this._selectors) {
            for (let i = 0; i < this._selectors.length; i++) {
                let selector = this._selectors[i];
                let selectorParts = selector.split('|||');
                if (selectorParts.length > 1) {
                    this._selectors[i] = selectorParts[1].trim();
                }
            }
        }
    }

    async addFrameToVideo(forced?: boolean): Promise<void> {
        if (this._videoRecorder && (this._takeSnapshot || forced)) {
            await this._videoRecorder.addFrame();
        }
    }

    async highlightElement(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item || this._session?.type !== 'web') {
            return;
        }

        if (!(await item.isDisplayed())) {
            return;
        }

        try {
            this._originalBorderCSS = await item.getCSSProperty('border');
            await driver.execute((el: any) => {
                let elt = el;
                while (elt.parentNode && elt.parentNode.children.length === 1) {
                    elt = elt.parentNode;
                }
                elt.style.border = '3px solid orangered';
            }, item);
        } catch {
            logger.info(`Could not be highlighted: ${JSON.stringify(item)}`);
        }
    }

    async revertElement(driver: Browser, item: ChainablePromiseElement | null): Promise<void> {
        if (!item || !this._originalBorderCSS || this._session?.type !== 'web') {
            return;
        }

        try {
            if (!(await item.isExisting()) || !(await item.isDisplayed())) {
                return;
            }

            await driver.execute(
                (el: any, css: any) => {
                    let elt = el;
                    while (elt.parentNode && elt.parentNode.children.length === 1) {
                        elt = elt.parentNode;
                    }
                    elt.style.border = css;
                },
                item,
                this._originalBorderCSS.value
            );
        } catch {
            logger.info(`Could not revert highlight: ${JSON.stringify(item)}`);
        } finally {
            this._originalBorderCSS = '';
        }
    }

    async run(
        session: RunSession,
        functions: TrFunction[],
        apis: TrApi[],
        variables: Record<string, string>,
        savedElements: Record<string, ChainablePromiseElement>,
        videoRecorder: VideoRecorder | null = null,
        videoBaseStep: string = ''
    ): Promise<boolean> {
        this._session = session;
        this._functions = functions;
        this._apis = apis;
        this._variables = variables;
        this._savedElements = savedElements;
        this._videoRecorder = videoRecorder || null;
        this._videoBaseStep = videoBaseStep;

        if (!session.driver) {
            throw new TestRunnerError('Step::No driver available to execute step');
        }

        try {
            if (this._condition) {
                let conditionResult = await this._condition.evaluate(session.driver, variables, session.runConf);
                if (!conditionResult) {
                    this._status = 'skipped';
                    return true;
                }
            }

            let item: ChainablePromiseElement | null = null;
            if (StepsCommands.RequiresItem(this._command)) {
                item = await this.selectItem(session.driver);
                if (!item) {
                    if (this._namedElement) {
                        throw new TestItemNotFoundError(
                            `Item with named element [${this._namedElement}] not found - check previous steps`
                        );
                    } else {
                        throw new TestItemNotFoundError(`Item with selectors [${this._usedSelectors}] not found`);
                    }
                }
            }

            await this.highlightElement(session.driver, item);

            await this.execute(session.driver, item);

            await this.addFrameToVideo();

            await this.revertElement(session.driver, item);
        } catch (error) {
            this._status = 'failed';
            this._errorDetails = `${(error as Error).message}`;

            await this.addFrameToVideo();

            return false;
        }

        return true;
    }

    async selectItem(driver: Browser): Promise<ChainablePromiseElement | null> {
        if (this._namedElement) {
            if (this._savedElements && this._savedElements[this._namedElement]) {
                const saved = this._savedElements[this._namedElement];
                if (saved && (await saved.isDisplayed())) {
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
        let selectors = this._selectors;
        if (!selectors || selectors.length === 0) {
            return null;
        }

        let item: ChainablePromiseElement | null = null;
        this._usedSelectors = '';
        for (let i = 0; i < selectors.length; i++) {
            const selector = replaceVariables(selectors[i], this._variables || {});
            if (this._usedSelectors.length > 0) {
                this._usedSelectors += ',';
            }
            this._usedSelectors += `"${selector}"`;

            if (this._position === -1) {
                item = await driver.$(selector);
                if (!item || item.error) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        item = await driver.$(selector);
                    }
                }
                const isDisplayed = await item.isDisplayed();
                if (!isDisplayed) {
                    const items = await driver.$$(selector);
                    const itemCount = await items.length;
                    if (itemCount > 1) {
                        for (let j = 0; j < itemCount; j++) {
                            if (await items[j].isDisplayed()) {
                                item = items[j];
                                break;
                            }
                        }
                    }
                }
            } else {
                let items = await driver.$$(selector);
                if (!items || !(await items.length)) {
                    const keyboardHidden = await this.doHideKeyboard(driver);
                    if (keyboardHidden) {
                        items = await driver.$$(selector);
                    }
                }
                if (items && (await items.length) > this._position) {
                    item = items[this._position];
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

    async selectItems(driver: Browser): Promise<ChainablePromiseArray | null> {
        let selectors = this._selectors;
        if (!selectors || selectors.length === 0) {
            return null;
        }

        let allItems: ChainablePromiseArray | null = null;
        this._usedSelectors = '';
        for (let i = 0; i < selectors.length; i++) {
            const selector = replaceVariables(selectors[i], this._variables || {});
            if (this._usedSelectors.length > 0) {
                this._usedSelectors += ',';
            }
            this._usedSelectors += `"${selector}"`;

            const items = await driver.$$(selector);
            if (items && (await items.length) > 0) {
                allItems = items;
                break;
            }
        }
        if (!allItems || (await allItems.length) === 0) {
            return null;
        }

        return allItems;
    }

    abstract execute(driver: Browser, item: ChainablePromiseElement | null): Promise<void>;

    async executeScript(driver: Browser, script: string, type: string): Promise<any> {
        try {
            if (type === 'sync') {
                const result = await driver.execute(script);
                if (!result) {
                    throw new TestRunnerError(`ExecuteScript::Script: script for step ${this._sequence} failed`);
                }
                logger.info(
                    `ExecuteScript::Script: driver script for step ${this._sequence} succeeded: ${JSON.stringify(result)}`
                );
                return result;
            } else {
                const localScript = prepareLocalScript(script);
                const result = await vmRun(localScript, this._variables ?? undefined);
                if (!result || !result.success) {
                    throw new TestRunnerError(
                        `ExecuteScript::Script: local script for step ${this._sequence} failed ${result.error}`
                    );
                }
                logger.info(
                    `ExecuteScript::Script: local script for step ${this._sequence} succeeded: ${JSON.stringify(result)}`
                );
                return result.output;
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(
                    `ExecuteScript::Script: script for step ${this._sequence} failed with error ${error}`
                );
            }
        }
    }

    async doHideKeyboard(driver: Browser): Promise<boolean> {
        if (this._session?.type === 'mobile' && this._hideKeyboard) {
            const isKeyBoaordShown = await driver.isKeyboardShown();
            if (isKeyBoaordShown) {
                await driver.hideKeyboard();
                return true;
            }
        }

        return false;
    }
}

export = BaseStep;
