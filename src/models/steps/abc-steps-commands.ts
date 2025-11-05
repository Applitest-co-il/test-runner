export class StepsCommands {
    static commands: string[] = [
        //generic
        'pause',
        'navigate',
        'app-activate',
        'app-background',
        'switch-frame',
        'hide-keyboard',

        //function
        'call-function',
        'call-api',
        'function',
        'api',

        //settings
        'toggle-location-services',
        'toggle-airplane-mode',
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

        //waits
        'wait-for-exist',
        'wait-for-not-exist',

        //assertions
        'assert-text',
        'assert-is-displayed',
        'assert-is-not-displayed',
        'assert-attribute',
        'assert-css',
        'assert-number',
        'assert-app-installed'
    ];

    static RequiresSelector(command: string): boolean {
        const noSelectorCommands = [
            'pause',
            'navigate',
            'app-activate',
            'app-background',
            'hide-keyboard',
            'function',
            'api',
            'toggle-location-services',
            'toggle-airplane-mode',
            'set-geolocation',
            'set-variable',
            'generate-random-integer',
            'generate-random-string',
            'clear-variable',
            'click-coordinates',
            'press-key',
            'execute-script',
            'perform-actions'
        ];
        return !noSelectorCommands.includes(command);
    }

    static RequiresValue(command: string): boolean {
        const requiresValueCommands = [
            'pause',
            'navigate',
            'set-value',
            'add-value',
            'press-key',
            'execute-script',
            'function',
            'api',
            'set-variable',
            'generate-random-integer',
            'generate-random-string',
            'assert-text',
            'assert-attribute',
            'assert-css',
            'assert-number',
            'click-coordinates'
        ];
        return requiresValueCommands.includes(command);
    }

    static RequiresItem(command: string): boolean {
        const noItemCommands = [
            'pause',
            'navigate',
            'app-activate',
            'app-background',
            'hide-keyboard',
            'function',
            'api',
            'toggle-location-services',
            'toggle-airplane-mode',
            'set-geolocation',
            'set-variable',
            'generate-random-integer',
            'generate-random-string',
            'clear-variable',
            'click-coordinates',
            'press-key',
            'execute-script',
            'perform-actions'
        ];
        return !noItemCommands.includes(command);
    }
}

export default StepsCommands;
