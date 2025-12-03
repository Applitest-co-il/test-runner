import { TestDefinitionError } from '../helpers/test-errors';
import { TestStep } from '../types';

// Import step classes - ordered alphabetically
import AddValueStep from './steps/add-value-step';
import ApiStep from './steps/api-step';
import AssertAccessibilityPropertyStep from './steps/assert-accessibility-property-step';
import AppActivateStep from './steps/app-activate-step';
import AppBackgroundStep from './steps/app-background-step';
import AssertAppInstalledStep from './steps/assert-app-installed-step';
import AssertAttributeStep from './steps/assert-attribute-step';
import AssertCssStep from './steps/assert-css-step';
import AssertIsDisplayedStep from './steps/assert-is-displayed-step';
import AssertIsNotDisplayedStep from './steps/assert-is-not-displayed-step';
import AssertNumberStep from './steps/assert-number-step';
import AssertTextStep from './steps/assert-text-step';
import AssertTextMultipleStep from './steps/assert-text-multiple-step';
import ClearValueStep from './steps/clear-value-step';
import ClickCoordinatesStep from './steps/click-coordinates-step';
import ClickMultipleStep from './steps/click-multiple-step';
import ClickStep from './steps/click-step';
import DragAndDropStep from './steps/drag-and-drop-step';
import ExecuteScriptStep from './steps/execute-script-step';
import FunctionStep from './steps/function-step';
import HideKeyboardStep from './steps/hide-keyboard-step';
import ItemClearStep from './steps/item-clear-step';
import ItemSelectStep from './steps/item-select-step';
import MiddleClickStep from './steps/middle-click-step';
import MouseHoverStep from './steps/mouse-hover-step';
import MouseMoveStep from './steps/mouse-move-step';
import NavigateStep from './steps/navigate-step';
import PauseStep from './steps/pause-step';
import PerformActionsStep from './steps/perform-actions-steps';
import PressKeyStep from './steps/press-key-step';
import RightClickStep from './steps/right-click-step';
import ScrollDownFromElementStep from './steps/scroll-down-from-element-step';
import ScrollDownStep from './steps/scroll-down-step';
import ScrollDownToElementStep from './steps/scroll-down-to-element-step';
import ScrollLeftFromElementStep from './steps/scroll-left-from-element-step';
import ScrollLefttStep from './steps/scroll-left-step';
import ScrollRightFromElementStep from './steps/scroll-right-from-element-step';
import ScrollRightStep from './steps/scroll-right-step';
import ScrollUpFromElementStep from './steps/scroll-up-from-element-step';
import ScrollUpStep from './steps/scroll-up-step';
import ScrollUpToElementStep from './steps/scroll-up-to-element-step';
import SetLocationStep from './steps/settings-set-location-step';
import SetValueStep from './steps/set-value-step';
import SwitchFrameStep from './steps/switch-frame-step';
import ToggleAirplaneModeStep from './steps/settings-toggle-airplane-mode-step';
import ToggleLocationServicesStep from './steps/settings-toggle-location-services-step';
import UploadFileStep from './steps/upload-file-step';
import VariableClearStep from './steps/variable-clear-step';
import VariableRandomIntegerStep from './steps/variable-random-integer-step';
import VariableRandomStringStep from './steps/variable-random-string-step';
import VariableSetFromJavascriptStep from './steps/variable-set-step-from-javascript';
import VariableSetStep from './steps/variable-set-step';
import WaitForExistStep from './steps/wait-for-exist-step';
import WaitForNotExistStep from './steps/wait-for-not-exist-step';
import BaseStep from './steps/base-step';
import AssertCurrentTitleStep from './steps/assert-current-title-step';
import AssertCurrentUrlStep from './steps/assert-current-url-step';

export function stepFactory(sequence: number, step: TestStep): BaseStep {
    if (!step.command) {
        throw new TestDefinitionError('No command provided for step');
    }

    step.command = step.command.toLowerCase();

    //backward compatibility fix for previous misplaced commands
    switch (step.command) {
        case 'right-click':
            step.command = 'click-right';
            break;
        case 'middle-click':
            step.command = 'click-middle';
            break;
        case 'multiple-clicks':
            step.command = 'click-multiple';
            break;
        default:
            break;
    }

    switch (step.command) {
        //#region generic
        case 'app-activate':
            return new AppActivateStep(sequence, step);
        case 'app-background':
            return new AppBackgroundStep(sequence, step);
        case 'hide-keyboard':
            return new HideKeyboardStep(sequence, step);
        case 'navigate':
            return new NavigateStep(sequence, step);
        case 'pause':
            return new PauseStep(sequence, step);
        case 'switch-frame':
            return new SwitchFrameStep(sequence, step);
        //#endregion

        //#region functions & Apis

        case 'call-api':
            return new ApiStep(sequence, step);
        case 'call-function':
            return new FunctionStep(sequence, step);

        //#endregion

        //#region settings
        case 'set-geolocation':
            return new SetLocationStep(sequence, step);
        case 'toggle-airplane-mode':
            return new ToggleAirplaneModeStep(sequence, step);
        case 'toggle-location-services':
            return new ToggleLocationServicesStep(sequence, step);

        //#endregion

        //#region variables
        case 'clear-variable':
            return new VariableClearStep(sequence, step);
        case 'generate-random-integer':
            return new VariableRandomIntegerStep(sequence, step);
        case 'generate-random-string':
            return new VariableRandomStringStep(sequence, step);
        case 'item-clear':
            return new ItemClearStep(sequence, step);
        case 'item-select':
            return new ItemSelectStep(sequence, step);
        case 'set-variable':
        case 'set-variable-from-element':
            return new VariableSetStep(sequence, step);
        case 'set-variable-from-script':
            return new VariableSetFromJavascriptStep(sequence, step);
        //#endregion

        //#region actions
        case 'click':
            return new ClickStep(sequence, step);
        case 'multiple-clicks':
            return new ClickMultipleStep(sequence, step);
        case 'click-coordinates':
            return new ClickCoordinatesStep(sequence, step);
        case 'right-click':
            return new RightClickStep(sequence, step);
        case 'middle-click':
            return new MiddleClickStep(sequence, step);
        case 'set-value':
            return new SetValueStep(sequence, step);
        case 'add-value':
            return new AddValueStep(sequence, step);
        case 'clear-value':
            return new ClearValueStep(sequence, step);
        case 'press-key':
            return new PressKeyStep(sequence, step);
        case 'scroll-up':
            return new ScrollUpStep(sequence, step);
        case 'scroll-down':
            return new ScrollDownStep(sequence, step);
        case 'scroll-up-to-element':
            return new ScrollUpToElementStep(sequence, step);
        case 'scroll-down-to-element':
            return new ScrollDownToElementStep(sequence, step);
        case 'scroll-up-from-element':
            return new ScrollUpFromElementStep(sequence, step);
        case 'scroll-down-from-element':
            return new ScrollDownFromElementStep(sequence, step);
        case 'scroll-right':
            return new ScrollRightStep(sequence, step);
        case 'scroll-left':
            return new ScrollLefttStep(sequence, step);
        case 'scroll-right-from-element':
            return new ScrollRightFromElementStep(sequence, step);
        case 'scroll-left-from-element':
            return new ScrollLeftFromElementStep(sequence, step);
        case 'execute-script':
            return new ExecuteScriptStep(sequence, step);
        case 'perform-actions':
            return new PerformActionsStep(sequence, step);
        case 'drag-and-drop':
            return new DragAndDropStep(sequence, step);
        case 'mouse-hover':
            return new MouseHoverStep(sequence, step);
        case 'mouse-move':
            return new MouseMoveStep(sequence, step);
        case 'upload-file':
            return new UploadFileStep(sequence, step);
        //#endregion

        //#region assertions
        case 'wait-for-exist':
            return new WaitForExistStep(sequence, step);
        case 'wait-for-not-exist':
            return new WaitForNotExistStep(sequence, step);
        case 'assert-accessibility-property':
            return new AssertAccessibilityPropertyStep(sequence, step);
        case 'assert-is-displayed':
            return new AssertIsDisplayedStep(sequence, step);
        case 'assert-is-not-displayed':
            return new AssertIsNotDisplayedStep(sequence, step);
        case 'assert-text':
            return new AssertTextStep(sequence, step);
        case 'assert-text-multiple':
            return new AssertTextMultipleStep(sequence, step);
        case 'assert-number':
            return new AssertNumberStep(sequence, step);
        case 'assert-css-property':
            return new AssertCssStep(sequence, step);
        case 'assert-attribute':
            return new AssertAttributeStep(sequence, step);
        case 'assert-app-installed':
            return new AssertAppInstalledStep(sequence, step);
        case 'assert-current-title':
            return new AssertCurrentTitleStep(sequence, step);
        case 'assert-current-url':
            return new AssertCurrentUrlStep(sequence, step);
        //#endregion

        default:
            throw new TestDefinitionError(`Step command ${step.command} is not a valid one`);
    }
}
