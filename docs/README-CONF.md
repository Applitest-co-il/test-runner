# Applitest Test Runner Configuration

TBD

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

- command: command to execute
- value: provides information required to execute coomand
- selectors: list of selectors
- position: optional - in case selector matches and array of elements, the position of the target element
- operator: optional - in case command suports multiple operators, ability to indicate the one to use

Variables:

Selectors and values can include dynamic variables defined as {{\<variable name\>}}

Selectors:

You can use either xpath (default) or id selectors

- xpath: //\<xpath of element(s)\>
- id: id=\<id of element\>

### List of commands

#### Generic

Pause:

- command: "pause"
- value: number of miliseconds to pause

#### Variables

Set variable:

- command: set-variable
- value: \<variable name\>[|||\<static value to set\>]
- selectors: optional - selector where to capture value

Generate Random Integer:

- command: generate-random-integer
- value: \<variable name\>|||\<min value\>|||\<max value\>

#### Actions

Click:

- command: click
- selectors: element to be clicked

Multiple Clicks:

- command: multiple-clicks
- selectors: elment to be clicked
- value: number of subsequent clicks

Press key:

- command: press-key
- value: code of key to be pressed (e.g. 66 for enter)

Set Value:

- command: set-value
- selector: element to set value to (typically input element)

Scroll Up:

- command: scroll-up
- value: number of scrolls (finger moved)

Scroll down:

- command: scroll-down
- value: number of scrolls (finger moved)

Scroll up to element

- command: scroll-up-to-element
- selectors: scroll until element is in viewport
- value: timeout (in ms)

Scroll down to element:

- command: scroll-down-to-element
- selectors: scroll until element is in viewport
- value: timeout (in ms)

Wait for element:

- command: wait-for-exist
- value: timeout (in ms)
- selectors: element to search for

#### Assertions

Assert element is displayed:

- command: assert-is-displayed
- selectors: element to assert

Assert element matches a specific text:

- command: assert-text
- selectors: element to assert
- value: target text
- operator: ==, !=, starts-with, ends-with, contains - default: ==

Assert element matches specific number:

- command: assert-number
- selectors: element to assert
- value: target number
- operator: ==, <, >, <=, >=, != - default: ==
