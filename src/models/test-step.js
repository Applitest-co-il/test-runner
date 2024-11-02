const AssertAppInstalledStep = require('./steps/assert-app-installed-step.js');
const AssertAttributeStep = require('./steps/assert-attribute-step.js');
const AssertCssStep = require('./steps/assert-css-step.js');
const AssertIsDisplayedStep = require('./steps/assert-is-displayed-step.js');
const AssertIsNotDisplayedStep = require('./steps/assert-is-not-displayed-step.js');
const AssertNumberStep = require('./steps/assert-number-step.js');
const AssertTextStep = require('./steps/assert-text-step.js');
const ClickCoordinatesStep = require('./steps/click-coordinates-step.js');
const ClickMultipleStep = require('./steps/click-multiple-step.js');
const ClickStep = require('./steps/click-step.js');
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

const { TestDefinitionError } = require('../helpers/test-errors');

function stepFactory(sequence, step) {
    switch (step.command) {
        //generic
        case 'pause':
            return new PauseStep(sequence, step);

        case 'navigate':
            return new NavigateStep(sequence, step);

        //settings
        case 'toggle-location-services':
            return new ToggleLocationServicesStep(sequence, step);
        case 'toggle-airplane-mode':
            return new ToggleAirplaneModeStep(sequence, step);
        case 'set-geolocation':
            return new SetLocationStep(sequence, step);

        //variables
        case 'generate-random-integer':
            return new VariableRandomIntegerStep(sequence, step);
        case 'generate-random-string':
            return new VariableRandomStringStep(sequence, step);
        case 'set-variable':
            return new VariableSetStep(sequence, step);
        case 'set-variable-from-script':
            return new VariableSetFromJavascriptStep(sequence, step);

        //actions
        case 'click':
            return new ClickStep(sequence, step);
        case 'multiple-clicks':
            return new ClickMultipleStep(sequence, step);
        case 'click-coordinates':
            return new ClickCoordinatesStep(sequence, step);
        case 'set-value':
            return new SetValueStep(sequence, step);
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

        //assertions
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

        //default
        default:
            throw new TestDefinitionError(`Step command ${step.command} is not a valid one`);
    }
}

module.exports = {
    stepFactory
};
