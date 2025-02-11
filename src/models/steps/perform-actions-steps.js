const BaseStep = require('./base-step');
const { Key } = require('webdriverio');
const { TestRunnerError } = require('../../helpers/test-errors');

class PerformActionsStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        try {
            const json = JSON.parse(this.value);

            const type = json.type;
            let typeParams = null;
            if (type == 'pointer') {
                typeParams = { pointerType: json.pointerType ?? 'mouse' };
            }

            const action = typeParams ? await driver.action(type, typeParams) : driver.action(type);
            const actions = json.actions;

            if (actions && Array.isArray(actions) && actions.length > 0) {
                switch (type) {
                    case 'pointer':
                        await this.#performPointerAction(driver, action, actions);
                        break;
                    case 'key':
                        await this.#performKeyAction(action, actions);
                        break;
                    case 'wheel':
                        await this.#performWheelAction(action, actions);
                        break;
                    default:
                        break;
                }
            } else {
                throw new TestRunnerError(`PerformAction::Actions are required and should be an array of actions`);
            }
        } catch (error) {
            if (error instanceof TestRunnerError) {
                throw error;
            } else {
                throw new TestRunnerError(`PerformAction::Failed to apply action" - ${error.message}`);
            }
        }
    }

    async #performWheelAction(actionObj, actions) {
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
                        console.error(`PerformWheelAction::Invalid wheel action command "${action.command}"`);
                        break;
                }
            }
            await actionObj.perform();
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform wheel action  "${this.value}" - ${error.message}`
            );
        }
    }

    async #performKeyAction(actionObj, actions) {
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let key = Key[action.key] ? Key[action.key] : action.key;
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
                        console.error(`PerformKeyAction::Invalid key action command "${action.command}"`);
                }
            }
            await actionObj.perform();
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform key action  "${this.value}" - ${error.message}`
            );
        }
    }

    async #performPointerAction(driver, actionObj, actions) {
        try {
            let commandsCount = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let origin = 'viewport';
                commandsCount++;
                switch (action.command) {
                    case 'move':
                        if (action.origin) {
                            if (action.origin == 'pointer' || action.origin == 'viewport') {
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
                        console.error(`PerformPointerAction::Invalid pointer action command "${action.command}"`);
                        break;
                }

                if (action.command == 'up') {
                    await driver.pause(300);
                    await actionObj.perform();
                    actionObj.sequence = [];
                    commandsCount = 0;
                }
            }

            if (commandsCount > 0) {
                await actionObj.perform();
            }
        } catch (error) {
            throw new TestRunnerError(
                `PerformAction::Failed to perform pointer action  "${this.value}" - ${error.message}`
            );
        }
    }
}

module.exports = PerformActionsStep;
