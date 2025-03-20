class StepsCommands {
    static #commands = [
        //generic
        'pause',
        'navigate',
        'app-activate',
        'app-background',
        'switch-frame',
        'hide-keyboard',

        //settings
        'toggle-location-services',
        'toggle-airplane-mode',
        //'set-google-account',
        'set-geolocation',

        //variables
        'set-variable',
        'set-variable-from-element',
        'set-variable-from-script',
        'generate-random-integer',
        'generate-random-string',
        'clear-variable',
        'item-select',
        'item-clear',

        //actions
        'click',
        'multiple-clicks',
        'click-coordinates',
        'right-click',
        'middle-click',
        'set-value',
        'clear-value',
        'add-value',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right',
        'scroll-left',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'press-key',
        'execute-script',
        'perform-actions',
        'drag-and-drop',
        'mouse-hover',
        'mouse-move',

        //assertions
        'wait-for-exist',
        'wait-for-not-exist',
        'assert-is-displayed',
        'assert-is-not-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute',
        'assert-app-installed'
    ];

    static #commandsRequireItem = [
        'click',
        'multiple-clicks',
        'right-click',
        'middle-click',
        'set-value',
        'clear-value',
        'add-value',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'set-variable-from-element',
        'assert-is-displayed',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute',
        'drag-and-drop',
        'mouse-hover',
        'item-select'
    ];

    static #commandsRequireSelector = [
        ...StepsCommands.#commandsRequireItem,
        'wait-for-exist',
        'wait-for-not-exist',
        'assert-is-not-displayed',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'switch-frame'
    ];

    static #commandsRequireValue = [
        'app-activate',
        'multiple-clicks',
        'click-coordinates',
        'set-value',
        'press-key',
        'assert-text',
        'assert-number',
        'assert-css-property',
        'assert-attribute',
        'assert-app-installed',
        'scroll-up',
        'scroll-down',
        'scroll-up-to-element',
        'scroll-down-to-element',
        'scroll-up-from-element',
        'scroll-down-from-element',
        'scroll-right',
        'scroll-left',
        'scroll-right-from-element',
        'scroll-left-from-element',
        'generate-random-integer',
        'generate-random-string',
        'toggle-location-services',
        //'set-google-account',
        'set-geolocation',
        'execute-script',
        'perform-actions',
        'set-variable',
        'set-variable-from-script',
        'clear-variable',
        'navigate',
        'drag-and-drop',
        'mouse-hover',
        'mouse-move',
        'item-select',
        'item-clear'
    ];

    static get commands() {
        return StepsCommands.#commands;
    }

    static get commandsRequireItem() {
        return StepsCommands.#commandsRequireItem;
    }

    static get commandsRequireSelector() {
        return StepsCommands.#commandsRequireSelector;
    }

    static RequiresItem(command) {
        return StepsCommands.#commandsRequireItem.includes(command);
    }

    static RequiresSelector(command) {
        return StepsCommands.#commandsRequireSelector.includes(command);
    }

    static RequiresValue(command) {
        return StepsCommands.#commandsRequireValue.includes(command);
    }
}

module.exports = StepsCommands;
