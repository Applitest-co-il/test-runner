# Conditional Execution Reference

This document provides detailed information about conditional execution in the Applitest Test Runner. Conditions allow you to execute steps only when certain criteria are met, making your tests more robust and adaptable to different scenarios.

## Overview

Any step in your test can include a `condition` property that determines whether the step should be executed. If the condition evaluates to `false`, the step is skipped.

## Basic Condition Structure

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

## Condition Types

### exist

Checks if an element exists on the page/screen.

**Properties:**
- `type`: `"exist"`
- `selector` (required): Element selector to check

**Returns:** `true` if the element exists, `false` otherwise

**Example:**
```json
{
  "command": "click",
  "selectors": ["#submit-button"],
  "condition": {
    "type": "exist",
    "selector": "#submit-button"
  }
}
```

**Use Cases:**
- Click a button only if it's present
- Handle optional UI elements
- Skip steps when elements are missing

### not-exist

Checks if an element does NOT exist on the page/screen.

**Properties:**
- `type`: `"not-exist"`
- `selector` (required): Element selector to check

**Returns:** `true` if the element does not exist, `false` if it exists

**Example:**
```json
{
  "command": "set-value",
  "selectors": ["#email"],
  "value": "test@example.com",
  "condition": {
    "type": "not-exist",
    "selector": "#email-filled-indicator"
  }
}
```

**Use Cases:**
- Fill a field only if it's empty
- Show elements when others are hidden
- Handle different UI states

### value

Checks if an element's text content matches a specific value.

**Properties:**
- `type`: `"value"`
- `selector` (required): Element selector to check
- `value` (required): Expected text content

**Returns:** `true` if the element text equals the expected value (exact match)

**Example:**
```json
{
  "command": "click",
  "selectors": ["#language-button"],
  "condition": {
    "type": "value",
    "selector": "#current-language",
    "value": "English"
  }
}
```

**Use Cases:**
- Conditional actions based on element text
- Language-specific behavior
- State-dependent operations

### script

Executes custom JavaScript code to determine the condition.

**Properties:**
- `type`: `"script"`
- `script` (required): JavaScript code to execute

**Returns:** The boolean result of the script execution

**Platform Behavior:**
- **Web**: Executes in browser context
- **Mobile**: Executes in local Node.js context with access to variables

**Example (Web):**
```json
{
  "command": "click",
  "selectors": ["#advanced-options"],
  "condition": {
    "type": "script",
    "script": "return window.innerWidth > 1024;"
  }
}
```

**Example (Mobile/Local):**
```json
{
  "command": "set-value",
  "selectors": ["#username"],
  "value": "{{username}}",
  "condition": {
    "type": "script",
    "script": "return new Date().getHours() >= 9 && new Date().getHours() <= 17;"
  }
}
```

**Use Cases:**
- Complex conditional logic
- Screen size or device-specific behavior
- Time-based conditions
- Custom business logic

### browser

Checks if the current browser matches a specific browser name (web only).

**Properties:**
- `type`: `"browser"`
- `value` (required): Browser name to check against

**Returns:** `true` if running on the specified browser, `false` otherwise

**Supported Browser Names:**
- `"chrome"`
- `"firefox"`
- `"safari"`
- `"edge"`

**Example:**
```json
{
  "command": "click",
  "selectors": ["#chrome-specific-button"],
  "condition": {
    "type": "browser",
    "value": "chrome"
  }
}
```

**Use Cases:**
- Browser-specific workarounds
- Feature availability checks
- Cross-browser testing adaptations

## Variable Usage in Conditions

All condition properties support variable substitution using `{{variableName}}` syntax:

```json
{
  "command": "click",
  "selectors": ["#user-menu"],
  "condition": {
    "type": "value",
    "selector": "#current-user",
    "value": "{{expectedUser}}"
  }
}
```

## Multiple Conditions

While a single step can only have one condition, you can achieve multiple condition logic by using nested conditions or script conditions:

**Script-based multiple conditions:**
```json
{
  "command": "click",
  "selectors": ["#submit"],
  "condition": {
    "type": "script",
    "script": "return document.querySelector('#field1').value && document.querySelector('#field2').value;"
  }
}
```

## Condition Examples by Use Case

### Handling Optional Elements

```json
{
  "command": "click",
  "selectors": ["#cookie-accept"],
  "condition": {
    "type": "exist",
    "selector": "#cookie-banner"
  }
}
```

### Language-Specific Actions

```json
{
  "command": "click",
  "selectors": ["//a[text()='Agree']"],
  "condition": {
    "type": "value",
    "selector": "#page-language",
    "value": "en"
  }
}
```

### Mobile vs Web Behavior

```json
{
  "command": "click",
  "selectors": ["#mobile-menu"],
  "condition": {
    "type": "script",
    "script": "return window.innerWidth < 768;"
  }
}
```

### Time-Based Conditions

```json
{
  "command": "set-value",
  "selectors": ["#business-hours-field"],
  "value": "open",
  "condition": {
    "type": "script",
    "script": "return new Date().getHours() >= 9 && new Date().getHours() <= 17;"
  }
}
```

### Form State Validation

```json
{
  "command": "click",
  "selectors": ["#submit-button"],
  "condition": {
    "type": "not-exist",
    "selector": ".error-message"
  }
}
```

### Browser-Specific Actions

```json
{
  "command": "execute-script",
  "value": "document.querySelector('#file-input').click();",
  "condition": {
    "type": "browser",
    "value": "firefox"
  }
}
```

## Best Practices

### 1. Use Exist Conditions for Optional Elements

Always check if optional elements exist before interacting with them:

```json
{
  "command": "click",
  "selectors": ["#popup-close"],
  "condition": {
    "type": "exist",
    "selector": "#popup-close"
  }
}
```

### 2. Combine Conditions with Wait Commands

Use conditions with wait commands for better timing control:

```json
{
  "command": "wait-for-exist",
  "selectors": ["#loading"],
  "value": 1000,
  "condition": {
    "type": "exist",
    "selector": "#ajax-indicator"
  }
}
```

### 3. Keep Script Conditions Simple

For complex logic, consider breaking into multiple simpler conditions:

**Good:**
```json
{
  "condition": {
    "type": "script",
    "script": "return window.location.pathname === '/login';"
  }
}
```

**Better to avoid:**
```json
{
  "condition": {
    "type": "script", 
    "script": "return window.location.pathname === '/login' && document.querySelector('#username').value === '' && new Date().getHours() > 8;"
  }
}
```

### 4. Use Variables for Reusability

Define condition values as variables for easier maintenance:

```json
{
  "variables": {
    "expectedBrowser": "chrome",
    "requiredElement": "#important-button"
  }
}
```

```json
{
  "condition": {
    "type": "browser",
    "value": "{{expectedBrowser}}"
  }
}
```

### 5. Document Complex Conditions

Use the `note` property to explain complex conditional logic:

```json
{
  "command": "click",
  "selectors": ["#advanced-feature"],
  "note": "Only click if running on Chrome and screen width > 1024px",
  "condition": {
    "type": "script",
    "script": "return navigator.userAgent.includes('Chrome') && window.innerWidth > 1024;"
  }
}
```

## Error Handling

### Condition Validation Errors

The test runner validates conditions at runtime:

- **Missing required properties**: Each condition type requires specific properties
- **Invalid selectors**: Malformed CSS or XPath selectors
- **Script errors**: JavaScript syntax or execution errors

### Common Issues and Solutions

**Invalid selector in condition:**
```json
// ❌ Bad
{
  "condition": {
    "type": "exist",
    "selector": "invalid>>selector"
  }
}

// ✅ Good  
{
  "condition": {
    "type": "exist",
    "selector": "#valid-id"
  }
}
```

**Missing required properties:**
```json
// ❌ Bad
{
  "condition": {
    "type": "value",
    "selector": "#element"
    // Missing 'value' property
  }
}

// ✅ Good
{
  "condition": {
    "type": "value", 
    "selector": "#element",
    "value": "expected text"
  }
}
```

## Platform Differences

### Web Platform
- All condition types are supported
- Script conditions execute in browser context
- Browser condition only works on web platform

### Mobile Platform  
- All condition types supported except `browser`
- Script conditions execute in Node.js context
- Element selectors use XPath format

### API Platform
- Conditions are not applicable for API-only tests
- Steps with conditions will be skipped

## Integration with Test Flow

Conditions integrate seamlessly with the test execution flow:

1. **Step Evaluation**: Before executing a step, the condition is evaluated
2. **Variable Resolution**: Variables in conditions are resolved with current values
3. **Skip Behavior**: If condition returns `false`, step is marked as "skipped"
4. **Continue Execution**: Test continues with the next step regardless of condition result
5. **Logging**: Skipped steps are logged for debugging purposes

## Advanced Examples

### Conditional Test Flow Based on Environment

```json
{
  "command": "navigate",
  "value": "{{baseUrl}}/admin",
  "condition": {
    "type": "script",
    "script": "return '{{environment}}' === 'development';"
  }
}
```

### Dynamic Element Interaction

```json
{
  "command": "click",
  "selectors": ["#dynamic-button"],
  "condition": {
    "type": "script",
    "script": "return document.querySelector('#dynamic-button').textContent.includes('{{expectedText}}');"
  }
}
```

### Responsive Design Testing

```json
{
  "command": "click", 
  "selectors": ["#mobile-menu"],
  "condition": {
    "type": "script",
    "script": "return window.getComputedStyle(document.querySelector('#mobile-menu')).display !== 'none';"
  }
}
```

This comprehensive conditions reference provides all the information needed to effectively use conditional execution in your Applitest Test Runner tests.