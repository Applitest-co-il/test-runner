const { TestDefinitionError } = require('../helpers/test-errors');

const AddValueStep = require('./steps/add-value-step.js');
const AppActivateStep = require('./steps/app-activate-step.js');
const AppBackgroundStep = require('./steps/app-background-step.js');
const AssertAppInstalledStep = require('./steps/assert-app-installed-step.js');
const AssertAttributeStep = require('./steps/assert-attribute-step.js');
const AssertCssStep = require('./steps/assert-css-step.js');
const AssertIsDisplayedStep = require('./steps/assert-is-displayed-step.js');
const AssertIsNotDisplayedStep = require('./steps/assert-is-not-displayed-step.js');
const AssertNumberStep = require('./steps/assert-number-step.js');
const AssertTextStep = require('./steps/assert-text-step.js');
const ClearValueStep = require('./steps/clear-value-step.js');
const ClickCoordinatesStep = require('./steps/click-coordinates-step.js');
const ClickMultipleStep = require('./steps/click-multiple-step.js');
const ClickStep = require('./steps/click-step.js');
const RightClickStep = require('./steps/right-click-step.js');
const MiddleClickStep = require('./steps/middle-click-step.js');
const ExecuteScriptStep = require('./steps/execute-script-step.js');
const NavigateStep = require('./steps/navigate-step.js');
const PauseStep = require('./steps/pause-step.js');
const PerformActionsStep = require('./steps/perform-actions-steps.js');
const PressKeyStep = require('./steps/press-key-step.js');
const ScrollDownFromElementStep = require('./steps/scroll-down-from-element-step.js');
const ScrollDownStep = require('./steps/scroll-down-step.js');
const ScrollDownToElementStep = require('./steps/scroll-down-to-element-step.js');
const ScrollLeftFromElementStep = require('./steps/scroll-left-from-element-step.js');
const ScrollLefttStep = require('./steps/scroll-left-step.js');
const ScrollRightFromElementStep = require('./steps/scroll-right-from-element-step.js');
const ScrollRightStep = require('./steps/scroll-right-step.js');
const ScrollUpFromElementStep = require('./steps/scroll-up-from-element-step.js');
const ScrollUpStep = require('./steps/scroll-up-step.js');
const ScrollUpToElementStep = require('./steps/scroll-up-to-element-step.js');
const SetValueStep = require('./steps/set-value-step.js');
const SetLocationStep = require('./steps/settings-set-location-step.js');
const ToggleAirplaneModeStep = require('./steps/settings-toggle-airplane-mode-step.js');
const ToggleLocationServicesStep = require('./steps/settings-toggle-location-services-step.js');
const VariableRandomIntegerStep = require('./steps/variable-random-integer-step.js');
const VariableRandomStringStep = require('./steps/variable-random-string-step.js');
const VariableSetFromJavascriptStep = require('./steps/variable-set-step-from-javascript.js');
const VariableSetStep = require('./steps/variable-set-step.js');
const WaitForExistStep = require('./steps/wait-for-exist-step.js');
const WaitForNotExistStep = require('./steps/wait-for-not-exist-step.js');
const SwitchFrameStep = require('./steps/switch-frame-step.js');
const DragAndDropStep = require('./steps/drag-and-drop-step.js');
const HideKeyboardStep = require('./steps/hide-keyboard-step.js');
const MouseHoverStep = require('./steps/mouse-hover-step.js');
const MouseMoveStep = require('./steps/mouse-move-step.js');
const ItemSelectStep = require('./steps/item-select-step.js');
const ItemClearStep = require('./steps/item-clear-step.js');
const VariableClearStep = require('./steps/variable-clear-step.js');
const FunctionStep = require('./steps/function-step.js');
const ApiStep = require('./steps/api-step.js');
const UploadFileStep = require('./steps/upload-file-step.js');

function stepFactory(sequence, step) {
    switch (step.command) {
        //#region generic
        case 'pause':
            return new PauseStep(sequence, step);
        case 'navigate':
            return new NavigateStep(sequence, step);
        case 'app-activate':
            return new AppActivateStep(sequence, step);
        case 'app-background':
            return new AppBackgroundStep(sequence, step);
        case 'switch-frame':
            return new SwitchFrameStep(sequence, step);
        case 'hide-keyboard':
            return new HideKeyboardStep(sequence, step);
        //#endregion

        //#region functions & Apis

        case 'call-function':
            return new FunctionStep(sequence, step);
        case 'call-api':
            return new ApiStep(sequence, step);

        //#endregion

        //#region settings
        case 'toggle-location-services':
            return new ToggleLocationServicesStep(sequence, step);
        case 'toggle-airplane-mode':
            return new ToggleAirplaneModeStep(sequence, step);
        case 'set-geolocation':
            return new SetLocationStep(sequence, step);
        //#endregion

        //#region variables
        case 'generate-random-integer':
            return new VariableRandomIntegerStep(sequence, step);
        case 'generate-random-string':
            return new VariableRandomStringStep(sequence, step);
        case 'set-variable':
        case 'set-variable-from-element':
            return new VariableSetStep(sequence, step);
        case 'set-variable-from-script':
            return new VariableSetFromJavascriptStep(sequence, step);
        case 'clear-variable':
            return new VariableClearStep(sequence, step);
        case 'item-select':
            return new ItemSelectStep(sequence, step);
        case 'item-clear':
            return new ItemClearStep(sequence, step);
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
        case 'assert-is-displayed':
            return new AssertIsDisplayedStep(sequence, step);
        case 'assert-is-not-displayed':
            return new AssertIsNotDisplayedStep(sequence, step);
        case 'assert-text':
            return new AssertTextStep(sequence, step);
        case 'assert-number':
            return new AssertNumberStep(sequence, step);
        case 'assert-css-property':
            return new AssertCssStep(sequence, step);
        case 'assert-attribute':
            return new AssertAttributeStep(sequence, step);
        case 'assert-app-installed':
            return new AssertAppInstalledStep(sequence, step);
        //#endregion

        default:
            throw new TestDefinitionError(`Step command ${step.command} is not a valid one`);
    }
}

module.exports = {
    stepFactory
};
