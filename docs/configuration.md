# Configuration Reference

This guide explains how to create and structure test configuration files for the Applitest Test Runner.

## Configuration Structure

A test configuration file is a JSON document with the following main sections:

```json
{
  "runConfiguration": { ... },
  "variables": { ... },
  "functions": [ ... ],
  "suites": [ ... ]
}
```

## Run Configuration

The `runConfiguration` section defines how and where tests should be executed.

### Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `runType` | string | Yes | Execution type: `"web"`, `"mobile"`, `"api"`, or `"mixed"` |
| `farm` | string | No | Execution environment: `"local"`, `"saucelabs"`, `"applitest"` |
| `enableVideo` | boolean | No | Enable video recording during test execution |
| `noFollowReset` | boolean | No | Disable automatic reset between tests |
| `sessions` | array | Yes* | Array of session configurations (*required for mixed mode) |

### Session Configuration

When using `runType: "mixed"` or when you need multiple session types, define sessions in the `sessions` array:

```json
{
  "runConfiguration": {
    "runType": "mixed",
    "farm": "local",
    "enableVideo": true,
    "sessions": [
      {
        "type": "mobile",
        "appium": { ... }
      },
      {
        "type": "web", 
        "browser": { ... }
      }
    ]
  }
}
```

## Mobile Session Configuration

For mobile testing (`type: "mobile"`):

```json
{
  "type": "mobile",
  "appium": {
    "platformName": "Android",
    "automationName": "UiAutomator2", 
    "deviceName": "Samsung_Galaxy_S23_Ultra_14_real",
    "app": "app.apk",
    "appPackage": "com.example.app",
    "appActivity": "com.example.MainActivity",
    "autoGrantPermissions": true,
    "reset": true,
    "forceAppInstall": false,
    "deviceLock": false,
    "orientation": "PORTRAIT"
  }
}
```

### Mobile Session Properties

| Property | Type | Description |
|----------|------|-------------|
| `platformName` | string | Platform: `"Android"` or `"iOS"` |
| `automationName` | string | Automation engine: `"UiAutomator2"`, `"XCUITest"` |
| `deviceName` | string | Target device name |
| `app` | string | Path to app file (.apk, .ipa, or .app) |
| `appPackage` | string | Android app package identifier |
| `appActivity` | string | Android app main activity |
| `autoGrantPermissions` | boolean | Automatically grant app permissions |
| `reset` | boolean | Reset app state between tests |
| `forceAppInstall` | boolean | Force app reinstallation |
| `deviceLock` | boolean | Enable device lock simulation |
| `orientation` | string | Device orientation: `"PORTRAIT"` or `"LANDSCAPE"` |

## Web Session Configuration

For web testing (`type: "web"`):

```json
{
  "type": "web",
  "browser": {
    "name": "chrome",
    "version": "latest",
    "startUrl": "https://example.com",
    "resolution": "1920x1080",
    "incognito": false,
    "startMaximized": false,
    "emulate": ""
  }
}
```

### Web Session Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Browser: `"chrome"`, `"firefox"`, `"safari"`, `"edge"` |
| `version` | string | Browser version (for cloud providers) |
| `startUrl` | string | Initial URL to navigate to |
| `resolution` | string | Browser window size (e.g., "1920x1080") |
| `incognito` | boolean | Start browser in incognito/private mode |
| `startMaximized` | boolean | Start browser maximized |
| `emulate` | string | Device emulation mode |

## Cloud Provider Configuration

### SauceLabs Configuration

```json
{
  "runConfiguration": {
    "farm": "saucelabs",
    "user": "your-username",
    "user_key": "your-access-key",
    "sessions": [
      {
        "type": "mobile",
        "appium": {
          "platformName": "android",
          "deviceName": "Samsung_Galaxy_S23_Ultra_14_real",
          "app": "storage:filename=app.apk"
        }
      }
    ]
  }
}
```

### AWS Device Farm Configuration

```json
{
  "runConfiguration": {
    "farm": "aws",
    "sessions": [
      {
        "type": "mobile",
        "appium": {
          "platformName": "Android",
          "automationName": "UiAutomator2"
        }
      }
    ]
  }
}
```

## Variables

Global variables that can be used throughout the test configuration:

```json
{
  "variables": {
    "baseUrl": "https://example.com",
    "username": "testuser",
    "password": "testpass",
    "timeout": "5000"
  }
}
```

Variables are referenced using `{{variableName}}` syntax in test steps.

## Test Suites

Suites organize related tests and can be targeted to specific session types:

```json
{
  "suites": [
    {
      "id": "AS-mobile-suite",
      "name": "Mobile Login Tests",
      "type": "mobile",
      "waitBetweenTests": 1000,
      "stopOnFailure": false,
      "tests": [
        {
          "id": "T-login-test",
          "name": "Valid Login",
          "steps": [
            {
              "command": "wait-for-exist",
              "selectors": ["android|||#username"],
              "value": 5000
            },
            {
              "command": "set-value",
              "selectors": ["android|||#username"],
              "value": "{{username}}"
            }
          ]
        }
      ]
    }
  ]
}
```

### Suite Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique suite identifier |
| `name` | string | Suite name |
| `type` | string | Target session type: `"mobile"`, `"web"`, or `"api"` |
| `waitBetweenTests` | number | Delay between tests in milliseconds |
| `stopOnFailure` | boolean | Stop suite on first test failure |
| `tests` | array | Array of test objects |

### Test Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique test identifier |
| `name` | string | Test name |
| `steps` | array | Test steps to execute |

## Test Steps

Steps are individual actions performed during test execution.

### Common Step Structure

```json
{
  "command": "click",
  "selectors": ["#element-id", ".element-class"],
  "value": "optional-value",
  "position": 0,
  "operator": "starts-with",
  "note": "Optional description",
  "condition": {
    "type": "exist",
    "selector": "#prerequisite-element"
  }
}
```

### Step Properties

| Property | Type | Description |
|----------|------|-------------|
| `command` | string | Action to perform |
| `selectors` | array | Element selectors (platform-specific) |
| `value` | string/number | Command-specific value |
| `position` | number | Element position when multiple matches |
| `operator` | string | Command-specific operator |
| `note` | string | Optional step description |
| `condition` | object | Conditional execution rules |

### Platform-Specific Selectors

Use the format `platform|||selector` for platform-specific selectors:

```json
{
  "selectors": [
    "default|||#element-id",
    "android|||//android.widget.Button[@text='Click Me']",
    "ios|||//XCUIElementTypeButton[@name='Click Me']"
  ]
}
```

Available platforms:

- `default` - Universal selector (works across platforms)
- `android` - Android-specific XPath selectors
- `ios` - iOS-specific XPath selectors
- `web` - Web-specific selectors

### Step Commands

The Applitest Test Runner supports a comprehensive set of step commands for different types of interactions and assertions. For detailed documentation of all available commands, their parameters, and usage examples, see the [Step Commands Reference](step-commands.md).

**Command Categories:**

- **Navigation**: `navigate`, `app-activate`, `app-background`, `switch-frame`
- **Element Interaction**: `click`, `set-value`, `clear-value`, `press-key`, `drag-and-drop`
- **Wait Commands**: `wait-for-exist`, `wait-for-not-exist`, `pause`
- **Assertions**: `assert-is-displayed`, `assert-text`, `assert-attribute`, `assert-css-property`
- **Scroll Commands**: `scroll-up`, `scroll-down`, `scroll-*-to-element`, `scroll-*-from-element`
- **Variable Commands**: `set-variable`, `generate-random-integer`, `generate-random-string`
- **Mobile-Specific**: `hide-keyboard`, `set-geolocation`, `toggle-location-services`
- **Advanced**: `execute-script`, `perform-actions`, `call-function`, `call-api`

**Common Step Structure:**

```json
{
  "command": "click",
  "selectors": ["#element-id"],
  "value": "optional-value",
  "position": 0,
  "operator": "starts-with",
  "note": "Optional description",
  "condition": {
    "type": "exist",
    "selector": "#prerequisite-element"
  }
}
```

### Variable Usage

Use `{{variableName}}` syntax to reference variables:

```json
{
  "command": "set-value",
  "selectors": ["#username"],
  "value": "{{userEmail}}"
}
```

### Conditional Execution

Steps can include conditions for conditional execution:

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

For detailed documentation on all condition types, usage examples, and best practices, see the [Conditional Execution Reference](conditions.md).

#### Basic Condition Types

| Type | Description | Required Fields |
|------|-------------|----------------|
| `exist` | Element exists on page | `selector` |
| `not-exist` | Element does not exist | `selector` |
| `script` | Custom JavaScript evaluation | `script` |
| `value` | Element text matches value | `selector`, `value` |
| `browser` | Browser name matches (web only) | `value` |

## Example Configurations

### Simple Mobile Test

```json
{
  "runConfiguration": {
    "runType": "mobile",
    "appium": {
      "platformName": "Android",
      "automationName": "UiAutomator2",
      "deviceName": "Android",
      "app": "/path/to/app.apk",
      "appPackage": "com.example.app",
      "appActivity": "com.example.MainActivity"
    }
  },
  "suites": [
    {
      "name": "Login Test",
      "tests": [
        {
          "name": "Valid Login",
          "steps": [
            {
              "command": "wait-for-exist",
              "selectors": ["android|||//android.widget.EditText[@resource-id='username']"],
              "value": 5000
            },
            {
              "command": "set-value",
              "selectors": ["android|||//android.widget.EditText[@resource-id='username']"],
              "value": "testuser"
            },
            {
              "command": "click",
              "selectors": ["android|||//android.widget.Button[@text='Login']"]
            }
          ]
        }
      ]
    }
  ]
}
```

### Mixed Session Configuration

```json
{
  "runConfiguration": {
    "runType": "mixed",
    "farm": "local",
    "sessions": [
      {
        "type": "mobile",
        "appium": {
          "platformName": "Android",
          "automationName": "UiAutomator2",
          "deviceName": "Android",
          "app": "app.apk",
          "appPackage": "com.example.app",
          "appActivity": "com.example.MainActivity"
        }
      },
      {
        "type": "web",
        "browser": {
          "name": "chrome",
          "startUrl": "https://example.com",
          "resolution": "1920x1080"
        }
      }
    ]
  },
  "variables": {
    "username": "testuser",
    "password": "testpass"
  },
  "suites": [
    {
      "name": "Mobile Tests",
      "type": "mobile",
      "tests": [...]
    },
    {
      "name": "Web Tests", 
      "type": "web",
      "tests": [...]
    }
  ]
}
```

## Sample Files

See the [samples/json/](../samples/json/) directory for complete example configurations:

- [run.json](../samples/json/run.json) - Mobile app testing
- [test-manager-sample.json](../samples/json/test-manager-sample.json) - Mixed session testing
- [web1.json](../samples/json/web1.json) - Mobile testing with settings
- [web2.json](../samples/json/web2.json) - Mobile app testing with authentication

## Validation

Configuration files are validated at runtime. Common validation errors:

- Missing required properties (`runConfiguration.runType`, `sessions`)
- Invalid session types or command names
- Malformed selectors or missing target elements
- Circular function dependencies (if using functions)

Use the test runner API to validate configurations before execution.