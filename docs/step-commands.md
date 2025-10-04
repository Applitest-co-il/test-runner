# Step Commands Reference

This document provides detailed information about all available step commands in the Applitest Test Runner.

## Command Categories

- [Navigation Commands](#navigation-commands)
- [Element Interaction](#element-interaction)  
- [Wait Commands](#wait-commands)
- [Assertion Commands](#assertion-commands)
- [Scroll Commands](#scroll-commands)
- [Variable Commands](#variable-commands)
- [Mobile-Specific Commands](#mobile-specific-commands)
- [Advanced Commands](#advanced-commands)

## Navigation Commands

### navigate
Navigate to a URL (web) or perform navigation actions.

**Properties:**
- `value` (required): URL to navigate to
- `operator` (optional): `"new"` to open in new window

**Example:**
```json
{
  "command": "navigate",
  "value": "https://example.com"
}
```

**With new window:**
```json
{
  "command": "navigate", 
  "value": "https://example.com",
  "operator": "new"
}
```

### app-activate
Activate a mobile application.

**Properties:**
- `value` (required): App package/bundle ID or `"current-app"` for current app

**Example:**
```json
{
  "command": "app-activate",
  "value": "com.example.app"
}
```

### app-background
Send the current mobile app to background.

**Example:**
```json
{
  "command": "app-background"
}
```

### switch-frame
Switch to a specific frame/iframe (web only).

**Properties:**
- `selectors` (required): Frame selector

**Example:**
```json
{
  "command": "switch-frame",
  "selectors": ["#main-frame"]
}
```

## Element Interaction

### click
Click on an element.

**Properties:**
- `selectors` (required): Element selectors
- `position` (optional): Index when multiple elements match

**Example:**
```json
{
  "command": "click",
  "selectors": ["#submit-button"]
}
```

### multiple-clicks
Perform multiple clicks on an element.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Number of clicks

**Example:**
```json
{
  "command": "multiple-clicks",
  "selectors": ["#logo"],
  "value": 3
}
```

### right-click
Right-click on an element.

**Properties:**
- `selectors` (required): Element selectors

**Example:**
```json
{
  "command": "right-click",
  "selectors": [".context-menu-trigger"]
}
```

### middle-click
Middle-click on an element.

**Properties:**
- `selectors` (required): Element selectors

**Example:**
```json
{
  "command": "middle-click",
  "selectors": ["a[href='/link']"]
}
```

### click-coordinates
Click at specific coordinates.

**Properties:**
- `value` (required): Coordinates in format "x,y"

**Example:**
```json
{
  "command": "click-coordinates", 
  "value": "100,200"
}
```

### set-value
Set value in an input field.

**Properties:**
- `selectors` (required): Input field selectors
- `value` (required): Value to set

**Example:**
```json
{
  "command": "set-value",
  "selectors": ["#username"],
  "value": "{{username}}"
}
```

### add-value
Append value to existing input field content.

**Properties:**
- `selectors` (required): Input field selectors
- `value` (required): Value to append

**Example:**
```json
{
  "command": "add-value",
  "selectors": ["#message"],
  "value": " - Additional text"
}
```

### clear-value
Clear content of an input field.

**Properties:**
- `selectors` (required): Input field selectors

**Example:**
```json
{
  "command": "clear-value",
  "selectors": ["#search-input"]
}
```

### press-key
Press a keyboard key.

**Properties:**
- `value` (required): Key code (number) or key name

**Example:**
```json
{
  "command": "press-key",
  "value": 13
}
```

**Common key codes:**
- 13: Enter
- 27: Escape  
- 66: Enter (Android)

### upload-file
Upload a file to a file input element.

**Properties:**
- `selectors` (required): File input selectors
- `value` (required): Path to file

**Example:**
```json
{
  "command": "upload-file",
  "selectors": ["input[type='file']"],
  "value": "/path/to/file.jpg"
}
```

### drag-and-drop
Drag an element to another location.

**Properties:**
- `selectors` (required): Source element selectors
- `value` (required): Target selector or coordinates

**Example:**
```json
{
  "command": "drag-and-drop",
  "selectors": [".draggable-item"],
  "value": ".drop-zone"
}
```

### mouse-hover
Hover mouse over an element.

**Properties:**
- `selectors` (required): Element selectors
- `value` (optional): Hover duration in milliseconds

**Example:**
```json
{
  "command": "mouse-hover",
  "selectors": [".menu-item"],
  "value": 1000
}
```

### mouse-move
Move mouse to specific coordinates.

**Properties:**
- `value` (required): Coordinates in format "x,y"

**Example:**
```json
{
  "command": "mouse-move",
  "value": "150,250"
}
```

## Wait Commands

### wait-for-exist
Wait for an element to appear.

**Properties:**
- `selectors` (required): Element selectors
- `value` (optional): Timeout in milliseconds (default: 5000)

**Example:**
```json
{
  "command": "wait-for-exist",
  "selectors": ["#loading-spinner"],
  "value": 10000
}
```

### wait-for-not-exist
Wait for an element to disappear.

**Properties:**
- `selectors` (required): Element selectors
- `value` (optional): Timeout in milliseconds (default: 5000)

**Example:**
```json
{
  "command": "wait-for-not-exist",
  "selectors": ["#loading-spinner"],
  "value": 10000
}
```

### pause
Wait for a specified time.

**Properties:**
- `value` (required): Time in milliseconds

**Example:**
```json
{
  "command": "pause",
  "value": 3000
}
```

## Assertion Commands

### assert-is-displayed
Assert that an element is visible.

**Properties:**
- `selectors` (required): Element selectors

**Example:**
```json
{
  "command": "assert-is-displayed",
  "selectors": [".success-message"]
}
```

### assert-is-not-displayed
Assert that an element is not visible.

**Properties:**
- `selectors` (required): Element selectors

**Example:**
```json
{
  "command": "assert-is-not-displayed",
  "selectors": [".error-message"]
}
```

### assert-text
Assert element text content.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Expected text
- `operator` (optional): Comparison operator

**Operators:**
- `==` (default): Exact match
- `!=`: Not equal
- `starts-with`: Text starts with value
- `ends-with`: Text ends with value
- `contains`: Text contains value
- `not-contains`: Text does not contain value

**Example:**
```json
{
  "command": "assert-text",
  "selectors": ["h1"],
  "value": "Welcome",
  "operator": "starts-with"
}
```

### assert-number
Assert numeric value in element.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Expected number
- `operator` (optional): Comparison operator (`==`, `!=`, `>`, `<`, `>=`, `<=`)

**Example:**
```json
{
  "command": "assert-number",
  "selectors": [".price"],
  "value": 100,
  "operator": ">="
}
```

### assert-attribute
Assert element attribute value.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Format "attribute|||expected_value"
- `operator` (optional): `==` (default) or `!=`

**Example:**
```json
{
  "command": "assert-attribute",
  "selectors": ["#submit-btn"],
  "value": "disabled|||false"
}
```

### assert-css-property
Assert CSS property value.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Format "property|||expected_value"

**Example:**
```json
{
  "command": "assert-css-property",
  "selectors": [".highlight"],
  "value": "background-color|||rgb(255, 255, 0)"
}
```

### assert-app-installed
Assert that a mobile app is installed.

**Properties:**
- `value` (required): App package/bundle ID

**Example:**
```json
{
  "command": "assert-app-installed",
  "value": "com.example.app"
}
```

## Scroll Commands

### scroll-up
Scroll up by specified amount.

**Properties:**
- `value` (required): Scroll parameters (see scroll format)

**Example:**
```json
{
  "command": "scroll-up",
  "value": 500
}
```

### scroll-down
Scroll down by specified amount.

**Properties:**
- `value` (required): Scroll parameters

**Example:**
```json
{
  "command": "scroll-down",
  "value": 500
}
```

### scroll-up-to-element
Scroll up until element becomes visible.

**Properties:**
- `selectors` (required): Target element selectors
- `value` (required): Max scroll attempts or timeout

**Example:**
```json
{
  "command": "scroll-up-to-element",
  "selectors": ["#top-section"],
  "value": 5000
}
```

### scroll-down-to-element
Scroll down until element becomes visible.

**Properties:**
- `selectors` (required): Target element selectors
- `value` (required): Max scroll attempts or timeout

**Example:**
```json
{
  "command": "scroll-down-to-element",
  "selectors": ["#bottom-section"],
  "value": 5000
}
```

### scroll-left / scroll-right
Horizontal scrolling commands.

**Properties:**
- `value` (required): Scroll distance

**Example:**
```json
{
  "command": "scroll-right",
  "value": 300
}
```

### scroll-*-from-element
Scroll from a specific element as starting point.

**Properties:**
- `selectors` (required): Starting element selectors
- `value` (required): Scroll parameters

**Example:**
```json
{
  "command": "scroll-down-from-element",
  "selectors": [".carousel"],
  "value": 200
}
```

## Variable Commands

### set-variable
Set a variable value.

**Properties:**
- `value` (required): Format "variable_name|||value"

**Example:**
```json
{
  "command": "set-variable",
  "value": "username|||john.doe"
}
```

### set-variable-from-element
Set variable from element text content.

**Properties:**
- `selectors` (required): Element selectors
- `value` (required): Variable name

**Example:**
```json
{
  "command": "set-variable-from-element",
  "selectors": [".user-id"],
  "value": "currentUserId"
}
```

### set-variable-from-script
Set variable from script execution result.

**Properties:**
- `value` (required): Format "variable_name|||script_code"

**Example:**
```json
{
  "command": "set-variable-from-script",
  "value": "timestamp|||new Date().getTime()"
}
```

### generate-random-integer
Generate random integer variable.

**Properties:**
- `value` (required): Format "variable_name|||min|||max"

**Example:**
```json
{
  "command": "generate-random-integer",
  "value": "randomId|||1000|||9999"
}
```

### generate-random-string
Generate random string variable.

**Properties:**
- `value` (required): Format "variable_name|||length|||character_set"

**Example:**
```json
{
  "command": "generate-random-string",
  "value": "randomString|||8|||alphanumeric"
}
```

### clear-variable
Clear/delete a variable.

**Properties:**
- `value` (required): Variable name

**Example:**
```json
{
  "command": "clear-variable",
  "value": "temporaryVar"
}
```

## Mobile-Specific Commands

### hide-keyboard
Hide the mobile keyboard.

**Example:**
```json
{
  "command": "hide-keyboard"
}
```

### set-geolocation
Set device geolocation.

**Properties:**
- `value` (required): Coordinates in format "latitude,longitude"

**Example:**
```json
{
  "command": "set-geolocation",
  "value": "37.7749,-122.4194"
}
```

### toggle-location-services
Toggle location services on/off.

**Properties:**
- `value` (required): `"on"` or `"off"`

**Example:**
```json
{
  "command": "toggle-location-services",
  "value": "on"
}
```

### toggle-airplane-mode
Toggle airplane mode on/off.

**Properties:**
- `value` (required): `"on"` or `"off"`

**Example:**
```json
{
  "command": "toggle-airplane-mode",
  "value": "off"
}
```

## Advanced Commands

### execute-script
Execute JavaScript code.

**Properties:**
- `value` (required): JavaScript code
- `operator` (optional): `"sync"` (default), `"async"`, or `"local"`

**Example:**
```json
{
  "command": "execute-script",
  "value": "return document.title;",
  "operator": "sync"
}
```

### perform-actions
Perform complex touch/mouse actions.

**Properties:**
- `value` (required): Actions configuration (JSON)

**Example:**
```json
{
  "command": "perform-actions",
  "value": "[{\"type\": \"pointer\", \"id\": \"finger1\", \"parameters\": {\"pointerType\": \"touch\"}}]"
}
```

### call-function
Call a reusable function.

**Properties:**
- `value` (required): Format "function_id|||param1|||param2|||..."

**Example:**
```json
{
  "command": "call-function",
  "value": "login|||john.doe|||password123"
}
```

### call-api
Make an API call.

**Properties:**
- `value` (required): API configuration

**Example:**
```json
{
  "command": "call-api",
  "value": "api_id|||GET|||/users|||headers|||data"
}
```

### item-select
Select item from a list.

**Properties:**
- `selectors` (required): List element selectors
- `value` (required): Selection criteria

**Example:**
```json
{
  "command": "item-select",
  "selectors": [".dropdown-list"],
  "value": "Option 2"
}
```

### item-clear
Clear selection from a list.

**Properties:**
- `selectors` (required): List element selectors

**Example:**
```json
{
  "command": "item-clear",
  "selectors": [".multi-select"]
}
```

## Common Properties

All step commands support these common properties:

| Property | Type | Description |
|----------|------|-------------|
| `command` | string | The command to execute |
| `selectors` | array | Element selectors (when required) |
| `value` | string/number | Command-specific value (when required) |
| `position` | number | Element index when multiple matches |
| `operator` | string | Command-specific operator |
| `note` | string | Optional description for documentation |
| `condition` | object | Conditional execution rules |

## Selector Formats

### Platform-Specific Selectors
```json
{
  "selectors": [
    "default|||#element-id",
    "web|||.css-selector", 
    "android|||//android.widget.Button[@text='Click']",
    "ios|||//XCUIElementTypeButton[@name='Click']"
  ]
}
```

### CSS Selectors (Web)
```json
{
  "selectors": ["#id", ".class", "tag[attribute='value']"]
}
```

### XPath Selectors (Mobile)
```json
{
  "selectors": [
    "android|||//android.widget.EditText[@resource-id='username']",
    "ios|||//XCUIElementTypeTextField[@name='username']"
  ]
}
```

## Variable References

Use `{{variableName}}` syntax in any value field:

```json
{
  "command": "set-value",
  "selectors": ["#username"],
  "value": "{{userEmail}}"
}
```

## Conditional Execution

Add conditions to execute steps conditionally:

```json
{
  "command": "click",
  "selectors": ["#optional-button"],
  "condition": {
    "type": "exist",
    "selector": "#optional-button"
  }
}
```

For complete documentation on conditional execution, including all condition types, examples, and best practices, see the [Conditional Execution Reference](conditions.md).

### Condition Types

| Type | Description | Required Properties |
|------|-------------|-------------------|
| `exist` | Element exists | `selector` |
| `not-exist` | Element doesn't exist | `selector` |
| `script` | JavaScript returns true | `script` |
| `value` | Element text matches | `selector`, `value` |
| `browser` | Browser name matches (web only) | `value` |