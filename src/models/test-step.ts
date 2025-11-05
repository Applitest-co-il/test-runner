import { TestDefinitionError } from '../helpers/test-errors';
import { TestStep } from '../types';

// Import converted TypeScript step classes
import ClickStep from './steps/click-step';
import AppActivateStep from './steps/app-activate-step';
import FunctionStep from './steps/function-step';
import NavigateStep from './steps/navigate-step';
import PauseStep from './steps/pause-step';
import SetValueStep from './steps/set-value-step';

// Import remaining step classes - all now TypeScript
const AddValueStep = require('./steps/add-value-step');
const AppBackgroundStep = require('./steps/app-background-step');
const AssertAppInstalledStep = require('./steps/assert-app-installed-step');
const AssertAttributeStep = require('./steps/assert-attribute-step');
const AssertCssStep = require('./steps/assert-css-step');
const AssertIsDisplayedStep = require('./steps/assert-is-displayed-step');
const AssertIsNotDisplayedStep = require('./steps/assert-is-not-displayed-step');
const AssertNumberStep = require('./steps/assert-number-step');
const AssertTextStep = require('./steps/assert-text-step');
const ClearValueStep = require('./steps/clear-value-step');
const ClickCoordinatesStep = require('./steps/click-coordinates-step');
const ClickMultipleStep = require('./steps/click-multiple-step');
const RightClickStep = require('./steps/right-click-step');
const MiddleClickStep = require('./steps/middle-click-step');
const ExecuteScriptStep = require('./steps/execute-script-step');
const PerformActionsStep = require('./steps/perform-actions-steps');
const PressKeyStep = require('./steps/press-key-step');
const ScrollDownFromElementStep = require('./steps/scroll-down-from-element-step');
const ScrollDownStep = require('./steps/scroll-down-step');
const ScrollDownToElementStep = require('./steps/scroll-down-to-element-step');
const ScrollLeftFromElementStep = require('./steps/scroll-left-from-element-step');
const ScrollLefttStep = require('./steps/scroll-left-step');
const ScrollRightFromElementStep = require('./steps/scroll-right-from-element-step');
const ScrollRightStep = require('./steps/scroll-right-step');
const ScrollUpFromElementStep = require('./steps/scroll-up-from-element-step');
const ScrollUpStep = require('./steps/scroll-up-step');
const ScrollUpToElementStep = require('./steps/scroll-up-to-element-step');
const SetLocationStep = require('./steps/settings-set-location-step');
const ToggleAirplaneModeStep = require('./steps/settings-toggle-airplane-mode-step');
const ToggleLocationServicesStep = require('./steps/settings-toggle-location-services-step');
const VariableRandomIntegerStep = require('./steps/variable-random-integer-step');
const VariableRandomStringStep = require('./steps/variable-random-string-step');
const VariableSetFromJavascriptStep = require('./steps/variable-set-step-from-javascript');
const VariableSetStep = require('./steps/variable-set-step');
const WaitForExistStep = require('./steps/wait-for-exist-step');
const WaitForNotExistStep = require('./steps/wait-for-not-exist-step');
const SwitchFrameStep = require('./steps/switch-frame-step');
const DragAndDropStep = require('./steps/drag-and-drop-step');
const HideKeyboardStep = require('./steps/hide-keyboard-step');
const MouseHoverStep = require('./steps/mouse-hover-step');
const MouseMoveStep = require('./steps/mouse-move-step');
const ItemSelectStep = require('./steps/item-select-step');
const ItemClearStep = require('./steps/item-clear-step');
const VariableClearStep = require('./steps/variable-clear-step');
const ApiStep = require('./steps/api-step');
const AbcStepsCommands = require('./steps/abc-steps-commands');

export function stepFactory(sequence: number, stepData: TestStep): any {
    if (!stepData.command) {
        throw new TestDefinitionError('No command provided for step');
    }

    const command = stepData.command.toLowerCase();

    switch (command) {
        case 'add-value':
            return new AddValueStep(sequence, stepData);
        case 'app-activate':
            return new AppActivateStep(sequence, stepData);
        case 'app-background':
            return new AppBackgroundStep(sequence, stepData);
        case 'assert-app-installed':
            return new AssertAppInstalledStep(sequence, stepData);
        case 'assert-attribute':
            return new AssertAttributeStep(sequence, stepData);
        case 'assert-css':
            return new AssertCssStep(sequence, stepData);
        case 'assert-is-displayed':
            return new AssertIsDisplayedStep(sequence, stepData);
        case 'assert-is-not-displayed':
            return new AssertIsNotDisplayedStep(sequence, stepData);
        case 'assert-number':
            return new AssertNumberStep(sequence, stepData);
        case 'assert-text':
            return new AssertTextStep(sequence, stepData);
        case 'clear-value':
            return new ClearValueStep(sequence, stepData);
        case 'click-coordinates':
            return new ClickCoordinatesStep(sequence, stepData);
        case 'click-multiple':
            return new ClickMultipleStep(sequence, stepData);
        case 'click':
            return new ClickStep(sequence, stepData);
        case 'right-click':
            return new RightClickStep(sequence, stepData);
        case 'middle-click':
            return new MiddleClickStep(sequence, stepData);
        case 'execute-script':
            return new ExecuteScriptStep(sequence, stepData);
        case 'navigate':
            return new NavigateStep(sequence, stepData);
        case 'pause':
            return new PauseStep(sequence, stepData);
        case 'perform-actions':
            return new PerformActionsStep(sequence, stepData);
        case 'press-key':
            return new PressKeyStep(sequence, stepData);
        case 'scroll-down-from-element':
            return new ScrollDownFromElementStep(sequence, stepData);
        case 'scroll-down':
            return new ScrollDownStep(sequence, stepData);
        case 'scroll-down-to-element':
            return new ScrollDownToElementStep(sequence, stepData);
        case 'scroll-left-from-element':
            return new ScrollLeftFromElementStep(sequence, stepData);
        case 'scroll-left':
            return new ScrollLefttStep(sequence, stepData);
        case 'scroll-right-from-element':
            return new ScrollRightFromElementStep(sequence, stepData);
        case 'scroll-right':
            return new ScrollRightStep(sequence, stepData);
        case 'scroll-up-from-element':
            return new ScrollUpFromElementStep(sequence, stepData);
        case 'scroll-up':
            return new ScrollUpStep(sequence, stepData);
        case 'scroll-up-to-element':
            return new ScrollUpToElementStep(sequence, stepData);
        case 'set-value':
            return new SetValueStep(sequence, stepData);
        case 'settings-set-location':
            return new SetLocationStep(sequence, stepData);
        case 'settings-toggle-airplane-mode':
            return new ToggleAirplaneModeStep(sequence, stepData);
        case 'settings-toggle-location-services':
            return new ToggleLocationServicesStep(sequence, stepData);
        case 'variable-random-integer':
            return new VariableRandomIntegerStep(sequence, stepData);
        case 'variable-random-string':
            return new VariableRandomStringStep(sequence, stepData);
        case 'variable-set-from-javascript':
            return new VariableSetFromJavascriptStep(sequence, stepData);
        case 'variable-set':
            return new VariableSetStep(sequence, stepData);
        case 'wait-for-exist':
            return new WaitForExistStep(sequence, stepData);
        case 'wait-for-not-exist':
            return new WaitForNotExistStep(sequence, stepData);
        case 'switch-frame':
            return new SwitchFrameStep(sequence, stepData);
        case 'drag-and-drop':
            return new DragAndDropStep(sequence, stepData);
        case 'hide-keyboard':
            return new HideKeyboardStep(sequence, stepData);
        case 'mouse-hover':
            return new MouseHoverStep(sequence, stepData);
        case 'mouse-move':
            return new MouseMoveStep(sequence, stepData);
        case 'item-select':
            return new ItemSelectStep(sequence, stepData);
        case 'item-clear':
            return new ItemClearStep(sequence, stepData);
        case 'variable-clear':
            return new VariableClearStep(sequence, stepData);
        case 'api':
            return new ApiStep(sequence, stepData);
        case 'function':
            return new FunctionStep(sequence, stepData);
        default:
            // Try ABC steps as fallback
            try {
                return new AbcStepsCommands(sequence, stepData);
            } catch (error) {
                throw new TestDefinitionError(`Unknown command: ${command}`);
            }
    }
}
