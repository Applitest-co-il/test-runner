# Element Selection Process

One of the most important concepts in test automation is **element selection**. The Applitest Test Runner provides a comprehensive and intelligent element selection system that goes far beyond simple selection to facilitate your work when defining a full test.

## How Selection Works

When a test step requires element interaction, it includes one or more `selectors`. The test runner then initiates a sophisticated selection process:

1. **Multi-Selector Strategy**: Tests can define multiple selectors as fallbacks
2. **Variable Substitution**: Dynamic selector generation using test variables
3. **Smart Element Discovery**: Automatic handling of multiple matching elements
4. **Visibility and Interaction Checks**: Elements must be both present and interactable
5. **Mobile-Specific Optimizations**: Automatic keyboard hiding and display adjustments

## Selection Priority and Fallback

```json
{
  "selectors": [
    "aria/Some Text",
    "=Some Text",
    "*=Some Text",
    "//button[@text='Some text']"
  ]
}
```

The test runner will:

1. Try each selector in order until one succeeds
2. Handle variable replacement: `{{variableName}}` becomes actual values based either on environment variables provided when starting the run or collected previosuly during teh run (e.g. using one of the variables related command)
3. Return the first successfully located and interactable element

## Element Discovery Logic

For each selector, the system performs:

### Single Element Selection (`$`)

- Find the first matching element
- If element exists but isn't displayed, search through **all matching elements** to find a visible one
- Automatically handle mobile-specific issues (keyboard hiding, orientation changes)
- Return the first interactable element found

### Multiple Element Selection (`$$`)

- Find all matching elements
- Use position index if specified (e.g., click second button: `position: 1`)
- Filter by visibility and interaction capability
- Smart handling of dynamic lists and collections

### Named Element Management

- Elements can be saved with custom names using `item-select`
- Saved elements are cached and reused across test steps
- Automatic validity checking of cached elements

## Element Reuse with item-select

The `item-select` command allows you to find an element once and reuse it across multiple test steps. This is particularly useful for:

- **Performance optimization** - Avoid repeated element searches
- **Complex element targeting** - Use sophisticated selectors once, then reference by name
- **Multiple assertions** - Perform several checks on the same element
- **Dynamic content** - Capture elements that may change position or properties

### Basic Usage

```json
{
  "command": "item-select",
  "selectors": [
    "[data-testid='user-profile-card']",
    ".user-card",
    "//div[@class='profile-container']"
  ],
  "value": "userCard"
}
```

This step:

1. Uses the comprehensive selection process to find the element
2. Saves the element reference with the name "userCard"
3. Makes it available for subsequent steps

### Reusing Selected Elements

Once an element is selected and named, subsequent steps can reference it using the `namedElement` property:

```json
[
  {
    "command": "item-select",
    "selectors": ["[data-testid='product-card']"],
    "value": "productCard"
  },
  {
    "command": "assert-text",
    "namedElement": "productCard",
    "selectors": [".product-title"],
    "value": "Premium Widget",
    "operator": "=="
  },
  {
    "command": "assert-is-displayed",
    "namedElement": "productCard"
  },
  {
    "command": "click",
    "namedElement": "productCard",
    "selectors": [".add-to-cart-button"]
  }
]
```

### Named Element Behavior

When using `namedElement`:

1. **Priority**: Named elements take precedence over selectors
2. **Validation**: The test runner checks if the cached element is still valid
3. **Fallback**: If the named element is invalid, the system falls back to selectors (if provided)
4. **Scope**: Named elements persist throughout the test execution
5. **Performance**: Reusing elements is faster than repeated selection

### Best Practices for Element Reuse

1. **Use descriptive names**: Make element names clear and meaningful

   ```json
   "value": "navigationMenu"  // Good
   "value": "elem1"          // Avoid
   ```

2. **Select early**: Use `item-select` as soon as the element becomes available

   ```json
   [
     {"command": "wait-for-exist", "selectors": [".complex-widget"]},
     {"command": "item-select", "selectors": [".complex-widget"], "value": "widget"}
   ]
   ```

3. **Combine with complex selectors**: Save time on difficult-to-find elements

   ```json
   {
     "command": "item-select",
     "selectors": ["//div[contains(@class,'dynamic')]/following-sibling::div[@data-role='content'][1]"],
     "value": "dynamicContent"
   }
   ```

4. **Group related operations**: Perform all operations on an element in sequence

   ```json
   [
     {"command": "item-select", "selectors": [".data-table"], "value": "table"},
     {"command": "assert-is-displayed", "namedElement": "table"},
     {"command": "assert-text", "namedElement": "table", "selectors": [".row-count"], "value": "5 rows"},
     {"command": "click", "namedElement": "table", "selectors": [".sort-button"]}
   ]
   ```

## Selector Types

The test runner supports various selector formats depending on your target platform:

- **Accessibility-based**: `[aria-label='Submit']` for accessible element selection
- **Element Text**: `h1=Welcome to my Page`, `h1*=Sub` for text-based targeting
- **Data Attributes**: `[data-testid='login-button']` for test-specific targeting
- **CSS Selectors**: `#id`, `.class`, `[attribute="value"]` for web applications
- **XPath Selectors**: `//div[@class='content']` for precise element targeting

 A full list of supported selector types (and recommendations) can be found in the [WebdriverIO Selectors best practice page](https://webdriver.io/docs/selectors).

## Advanced Selection Features

### Variable Integration

```json
{
  "selectors": ["#user-{{userId}}", ".item[data-id='{{itemId}}']"],
  "value": "{{userInput}}"
}
```

### Accessibility-Aware Selection

- Integration with browser accessibility trees
- Role-based element discovery
- ARIA attribute support
- Screen reader compatibility testing

### Dynamic Content Handling

- Waits for element appearance with configurable timeouts
- Automatic retries with exponential backoff
- Handling of lazy-loaded content
- Dynamic list and table management

### Error Recovery

- Automatic keyboard dismissal on mobile
- Screen orientation adjustments
- Frame context recovery
- Element staleness detection and refresh

## Integration with Step Commands

Only step commands that require element interaction include `selectors`. When present, these selectors automatically trigger this comprehensive selection process. Whether you're clicking, typing, asserting element properties, or scrolling, the same intelligent element discovery system ensures reliable test execution.

Step commands that use selectors include:

- Element interaction commands (click, set-value, clear-value)
- Assertion commands that check element properties (assert-text, assert-is-displayed)
- Scroll commands that target specific elements
- Wait commands that monitor element states

For detailed information about specific step commands and their selector usage, see the [Step Commands Reference](step-commands.md).