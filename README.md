# test-runner

This app allows to run appium tests send as json file in applitest manager format

## Pre-requisites

-   Install NodeJs and NPM - Follow [this link](https://nodejs.org/en)
-   Install Android Studio - Follow [this link](https://developer.android.com/studio)
-   Install Appium - Follow [this link](https://appium.io/docs/en/2.0/quickstart/install/)
-   Install Android driver - Follow all instruction in [this link](https://appium.io/docs/en/2.0/quickstart/uiauto2-driver/)
-   Install Appium Inspector - Follow [this link](https://github.com/appium/appium-inspector/releases)

## Running the app

-   Clone repository on your computer
-   Go to main directory of the project or Open terminal in visual code
-   npm install
-   npm run api
    It will launch necessary window and start the server on port 8282 and be ready to receive instructions from the client (i.e app manger UI)

_Note_: you might need to override the device you launch depending what simulator you have installed on your machine - this can be done by adding running "npm run api [device avd name]" instead of just "npm run api"

## Tests commands

Step is defined as:

```json
{
    "command": "<command to run - see below details>",
    "value": "<string | number | boolean >",
    "selectors": ["<android|ios>|||<selector>  | <selector>"],
    "position": "<number>"
}
```

where:

-   command: command to execute
-   value: provides information required to execute coomand
-   selectors: list of selectors
-   position: optional - in case selector matches and array of elements, the position of the target element
-   operator: optional - in case command suports multiple operators, ability to indicate the one to use

Variables:

Selectors and values can include dynamic variables defined as {{\<variable name\>}}

Selectors:

You can use either xpath (default) or id selectors

-   xpath: //\<xpath of element(s)\>
-   id: id=\<id of element\>

### List of commands

#### Generic

Pause:

-   command: "pause"
-   value: number of miliseconds to pause

#### Variables

Set variable:

-   command: set-variable
-   value: \<variable name\>[|||\<static value to set\>]
-   selectors: optional - selector where to capture value

Generate Random Integer:

-   command: generate-random-integer
-   value: \<variable name\>|||\<min value\>|||\<max value\>

#### Actions

Click:

-   command: click
-   selectors: element to be clicked

Multiple Clicks:

-   command: multiple-clicks
-   selectors: elment to be clicked
-   value: number of subsequent clicks

Press key:

-   command: press-key
-   value: code of key to be pressed (e.g. 66 for enter)

Set Value:

-   command: set-value
-   selector: element to set value to (typically input element)

Scroll Up:

-   command: scroll-up
-   value: number of scrolls (finger moved)

Scroll down:

-   command: scroll-down
-   value: number of scrolls (finger moved)

Scroll up to element

-   command: scroll-up-to-element
-   selectors: scroll until element is in viewport
-   value: timeout (in ms)

Scroll down to element:

-   command: scroll-down-to-element
-   selectors: scroll until element is in viewport
-   value: timeout (in ms)

Wait for element:

-   command: wait-for-exist
-   value: timeout (in ms)
-   selectors: element to search for

#### Assertions

Assert element is displayed:

-   command: assert-is-displayed
-   selectors: element to assert

Assert element matches a specific text:

-   command: assert-text
-   selectors: element to assert
-   value: target text
-   operator: ==, !=, starts-with, ends-with, contains - default: ==

Assert element matches specific number:

-   command: assert-number
-   selectors: element to assert
-   value: target number
-   operator: ==, <, >, <=, >=, != - default: ==
