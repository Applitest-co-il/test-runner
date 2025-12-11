export class StepsCommands {
    static commands: string[] = [
        //generic
        'app-activate',
        'app-background',
        'browser-back',
        'browser-forward',
        'browser-refresh',
        'hide-keyboard',
        'navigate',
        'pause',
        'switch-frame',

        //function & APIs
        'call-api',
        'call-function',

        //settings
        'set-geolocation',
        'toggle-airplane-mode',
        'toggle-location-services',

        //variables
        'clear-variable',
        'generate-random-integer',
        'generate-random-string',
        'item-clear',
        'item-select',
        'set-variable',
        'set-variable-from-element',
        'set-variable-from-script',

        //actions
        'add-value',
        'clear-value',
        'click',
        'click-coordinates',
        'click-middle',
        'click-multiple',
        'click-right',
        'drag-and-drop',
        'execute-script',
        'mouse-hover',
        'mouse-move',
        'perform-actions',
        'press-key',
        'scroll-down',
        'scroll-down-from-element',
        'scroll-down-to-element',
        'scroll-left',
        'scroll-left-from-element',
        'scroll-right',
        'scroll-right-from-element',
        'scroll-up',
        'scroll-up-from-element',
        'scroll-up-to-element',
        'set-value',

        //waits
        'wait-for-exist',
        'wait-for-not-exist',

        //assertions
        'assert-accessibility-property',
        'assert-app-installed',
        'assert-attribute',
        'assert-css-property',
        'assert-current-title',
        'assert-current-url',
        'assert-is-displayed',
        'assert-is-not-displayed',
        'assert-number',
        'assert-text',
        'assert-text-multiple'
    ];

    static RequiresItem(command: string): boolean {
        const requireItemCommands = [
            'add-value',
            'assert-accessibility-property',
            'assert-attribute',
            'assert-css-property',
            'assert-is-displayed',
            'assert-number',
            'assert-text',
            'clear-value',
            'click',
            'click-middle',
            'click-multiple',
            'click-right',
            'drag-and-drop',
            'item-select',
            'mouse-hover',
            'scroll-down-from-element',
            'scroll-left-from-element',
            'scroll-right-from-element',
            'scroll-up-from-element',
            'set-value',
            'set-variable-from-element',
            'upload-file'
        ];
        return requireItemCommands.includes(command);
    }

    static RequiresSelector(command: string): boolean {
        const selectorCommands = [
            'assert-is-not-displayed',
            'assert-text-multiple',
            'scroll-down-to-element',
            'scroll-up-to-element',
            'switch-frame',
            'wait-for-exist',
            'wait-for-not-exist'
        ];
        return StepsCommands.RequiresItem(command) || selectorCommands.includes(command);
    }

    static RequiresValue(command: string): boolean {
        const requiresValueCommands = [
            'add-value',
            'api',
            'assert-accessibility-property',
            'assert-attribute',
            'assert-css-property',
            'assert-current-title',
            'assert-current-url',
            'assert-number',
            'assert-text',
            'click-coordinates',
            'execute-script',
            'function',
            'generate-random-integer',
            'generate-random-string',
            'navigate',
            'pause',
            'press-key',
            'set-value',
            'set-variable'
        ];
        return requiresValueCommands.includes(command);
    }
}

export default StepsCommands;
