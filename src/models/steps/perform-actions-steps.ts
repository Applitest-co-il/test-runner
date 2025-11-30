import BaseStep from './base-step';
import { Browser, ChainablePromiseElement, Key } from 'webdriverio';
import { TestRunnerError } from '../../helpers/test-errors';
import { logger } from '../../helpers/log-service';
import { TestStep } from '../../types';

interface ActionConfig {
    type: string;
    pointerType?: 'mouse' | 'pen' | 'touch';
    actions: any[];
}

interface PointerAction {
    command: string;
    origin?: string;
    duration?: number;
    x?: number;
    y?: number;
    button?: string;
}

interface KeyAction {
    command: string;
    key: string;
    duration?: number;
}

interface WheelAction {
    command: string;
    deltaX?: number;
    deltaY?: number;
    duration?: number;
}

export default class PerformActionsStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _: ChainablePromiseElement | null): Promise<void> {
        try {
            const value = this.value;
            if (!value) {
                throw new TestRunnerError('PerformAction::No value provided');
            }

            const json: ActionConfig = JSON.parse(value);
            let action;
            if (json.actions && Array.isArray(json.actions) && json.actions.length > 0) {
                switch (json.type) {
                    case 'pointer':
                        action = driver.action('pointer', { parameters: { pointerType: json.pointerType ?? 'mouse' } });
                        await this.performPointerAction(driver, action, json.actions);
                        break;
                    case 'key':
                        action = driver.action('key');
                        await this.performKeyAction(action, json.actions);
                        break;
                    case 'wheel':
                        action = driver.action('wheel');
                        await this.performWheelAction(action, json.actions);
                        break;
                    default:
                        break;
                }
            } else {
                throw new TestRunnerError(`PerformAction::Actions are required and should be an array of actions`);
            }
        } catch (error: any) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(`PerformAction::Failed to apply action" - ${error.message}`);
            }
        }
    }

    private async performWheelAction(actionObj: any, actions: WheelAction[]): Promise<void> {
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                switch (action.command) {
                    case 'scroll':
                        await actionObj.scroll({
                            deltaX: action.deltaX ?? 0,
                            deltaY: action.deltaY ?? 0,
                            duration: action.duration ?? 100
                        });
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        logger.error(`PerformWheelAction::Invalid wheel action command "${action.command}"`);
                        break;
                }
            }
            await actionObj.perform();
        } catch (error: any) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform wheel action  "${this.value}" - ${error.message}`
            );
        }
    }

    private async performKeyAction(actionObj: any, actions: KeyAction[]): Promise<void> {
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const key = (Key as any)[action.key] ? (Key as any)[action.key] : action.key;
                switch (action.command) {
                    case 'down':
                        await actionObj.down(key);
                        break;
                    case 'up':
                        await actionObj.up(key);
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        logger.error(`PerformKeyAction::Invalid key action command "${action.command}"`);
                        break;
                }
            }
            await actionObj.perform();
        } catch (error: any) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform key action  "${this.value}" - ${error.message}`
            );
        }
    }

    private async performPointerAction(driver: Browser, actionObj: any, actions: PointerAction[]): Promise<void> {
        try {
            let commandsCount = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let origin: any = 'viewport';
                commandsCount++;
                switch (action.command) {
                    case 'move':
                        if (action.origin) {
                            if (action.origin === 'pointer' || action.origin === 'viewport') {
                                origin = action.origin;
                            } else {
                                origin = await driver.$(action.origin);
                                if (!origin) {
                                    throw new TestRunnerError(
                                        `PerformAction::Origin item was not found for action ${i}`
                                    );
                                }
                            }
                        }
                        await actionObj.move({
                            origin: origin,
                            duration: action.duration ?? 100,
                            x: action.x ?? 0,
                            y: action.y ?? 0
                        });
                        break;
                    case 'down':
                        await actionObj.down(action.button ?? 'left');
                        break;
                    case 'up':
                        await actionObj.up(action.button ?? 'left');
                        break;
                    case 'pause':
                        await actionObj.pause(action.duration ?? 10);
                        break;
                    default:
                        logger.error(`PerformPointerAction::Invalid pointer action command "${action.command}"`);
                        break;
                }

                if (action.command === 'up') {
                    await driver.pause(300);
                    await actionObj.perform();
                    actionObj.sequence = [];
                    commandsCount = 0;
                }
            }

            if (commandsCount > 0) {
                await actionObj.perform();
            }
        } catch (error: any) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform pointer action  "${this.value}" - ${error.message}`
            );
        }
    }
}
