# Getting Started Guide

This guide will help you get up and running with Applitest Test Runner quickly.

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Running the Web Application

### Option 1: From Source Code

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the API server:**

   ```bash
   npm run api
   ```

3. **The server will start on port 8282** (or the port specified in your environment)

### Option 2: Pre-built Desktop Applications

Download the pre-built desktop applications for your platform:

- **Test Runner Desktop Project:** Gte the source code at *[GitHub](https://github.com/Applitest-co-il/test-runner-desktop)* .
- **Windows pre-built:** Windows Desktop App *([Download](https://app.applitest.co.il/downloads/ApplitestLocalRunner-win.exe))*
- **macOS pre-built:** macOS Desktop App *([Download](https://app.applitest.co.il/downloads/ApplitestLocalRunner-macos13.dmg))*

Note: the pre-built are not commercially signed and requires to be approved after you download them on your system.

## Testing the API

Once the server is running, you can test it using curl:

```bash
# Get version information
curl http://localhost:8282/version

# Run a test configuration
curl -X PATCH http://localhost:8282/test-runner \
  -H "Content-Type: application/json" \
  -d @samples/json/run.json
```

## Output Format

The test runner returns results in the following JSON format:

```json
{
  "runCompleted": true,
  "success": true,
  "summary": {
    "suites": 1,
    "passedSuites": 1,
    "total": 5,
    "passed": 5,
    "failed": 0,
    "skipped": 0,
    "pending": 0
  },
  "suiteResults": [
    {
      "name": "Suite Name",
      "success": true,
      "summary": {
        "total": 5,
        "passed": 5,
        "failed": 0,
        "skipped": 0,
        "pending": 0
      },
      "testResults": [...]
    }
  ],
  "executionTime": 45.678
}
```

### Response Fields

- **`runCompleted`** - Boolean indicating if the test run completed
- **`success`** - Boolean indicating overall test success
- **`summary`** - Aggregate statistics for all test suites
  - `suites` - Total number of test suites
  - `passedSuites` - Number of suites that passed completely
  - `total` - Total number of individual tests
  - `passed` - Number of tests that passed
  - `failed` - Number of tests that failed
  - `skipped` - Number of tests that were skipped
  - `pending` - Number of tests marked as pending
- **`suiteResults`** - Array of detailed results for each test suite
- **`executionTime`** - Total execution time in seconds

## Next Steps

- Learn how to create test configurations in the [Configuration Guide](configuration.md)
- Understand element selection and targeting in the [Element Selection Guide](element-selection.md)
- Review all available step commands in the [Step Commands Reference](step-commands.md)
- Set up local testing environment with the [Local Setup Guide](README-LOCAL.md)