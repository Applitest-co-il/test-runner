# REST API Documentation

The Applitest Test Runner provides a REST API for executing tests and managing test configurations.

## Base URL

When running locally:

```text
http://localhost:8282
```

The default port is 8282, but can be configured using the `TR_PORT` environment variable.

## Endpoints

### GET /version

Returns the current version of the test runner.

**Request:**

```bash
curl http://localhost:8282/version
```

**Response:**

```json
{
  "version": "1.0.0"
}
```

### GET /health

Returns the health status of the API server.

**Request:**

```bash
curl http://localhost:8282/health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "version": "1.0.0"
}
```

### POST /run

Executes a complete test configuration and returns the results.

**Request:**

```bash
curl -X POST http://localhost:8282/run \
  -H "Content-Type: application/json" \
  -d @configuration.json
```

**Request Body:**
The request body should contain a complete test configuration as described in the [Configuration Reference](configuration.md).

**Response:**
The API returns test execution results in the following format:

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
      "name": "Login Tests",
      "success": true,
      "summary": {
        "total": 5,
        "passed": 5,
        "failed": 0,
        "skipped": 0,
        "pending": 0
      },
      "testResults": [
        {
          "name": "Valid Login",
          "success": true,
          "steps": [
            {
              "sequence": 1,
              "command": "navigate",
              "status": "passed",
              "duration": 1.234
            }
          ]
        }
      ]
    }
  ],
  "executionTime": 45.678
}
```

#### Response Fields

**Root Level:**

- `runCompleted` (boolean) - Whether the test run completed successfully
- `success` (boolean) - Overall success status of all tests
- `summary` (object) - Aggregate statistics across all suites
- `suiteResults` (array) - Detailed results for each test suite
- `executionTime` (number) - Total execution time in seconds

**Summary Object:**

- `suites` (number) - Total number of test suites executed
- `passedSuites` (number) - Number of suites that passed completely
- `total` (number) - Total number of individual tests
- `passed` (number) - Number of tests that passed
- `failed` (number) - Number of tests that failed
- `skipped` (number) - Number of tests that were skipped
- `pending` (number) - Number of tests marked as pending

**Suite Result Object:**

- `name` (string) - Name of the test suite
- `success` (boolean) - Whether all tests in the suite passed
- `summary` (object) - Statistics for this specific suite
- `testResults` (array) - Results for individual tests in the suite

**Test Result Object:**

- `name` (string) - Name of the individual test
- `success` (boolean) - Whether the test passed
- `steps` (array) - Results for each step in the test
- `duration` (number) - Test execution time in seconds
- `error` (string) - Error message if test failed

**Step Result Object:**

- `sequence` (number) - Step number in the test
- `command` (string) - Command that was executed
- `status` (string) - Step status: `"passed"`, `"failed"`, `"skipped"`
- `duration` (number) - Step execution time in seconds
- `error` (string) - Error message if step failed

### PATCH /api

Test a single API call without running a full test suite.

**Request:**

```bash
curl -X PATCH http://localhost:8282/api \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "https://api.example.com/users",
    "headers": {"Authorization": "Bearer token123"},
    "data": null,
    "schema": null,
    "variables": {},
    "outputs": []
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "responseBody": {
    "users": []
  },
  "schemaValidation": true,
  "schemaValidationErrors": [],
  "outputs": {}
}
```

## Session Management

The API supports session-based testing for maintaining browser state across multiple test executions.

### POST /session

Create a new test session.

**Request:**

```bash
curl -X POST http://localhost:8282/session \
  -H "Content-Type: application/json" \
  -d @session-config.json
```

**Response:**

```json
{
  "success": true,
  "sessionId": "session_123456789",
  "message": "Session created successfully"
}
```

### PATCH /session/:sessionId

Run tests in an existing session.

**Request:**

```bash
curl -X PATCH http://localhost:8282/session/session_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "suites": [...]
    }
  }'
```

**Response:**

Returns the same format as POST /run but maintains session state.

### DELETE /session/:sessionId

Close and cleanup a test session.

**Request:**

```bash
curl -X DELETE http://localhost:8282/session/session_123456789
```

**Response:**

```json
{
  "success": true,
  "message": "Session closed successfully"
}
```

## HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success - Test execution completed |
| 400 | Bad Request - Invalid configuration |
| 500 | Internal Server Error - Execution failure |

## Error Response Format

When an error occurs, the API returns an error response:

```json
{
  "error": true,
  "message": "Configuration validation failed",
  "details": "Missing required property: runConfiguration.runType"
}
```

## Example Usage

### Running a Simple Web Test

```bash
curl -X POST http://localhost:8282/run \
  -H "Content-Type: application/json" \
  -d '{
    "runConfiguration": {
      "name": "Simple Web Test",
      "runType": "web",
      "sessions": [{
        "type": "web",
        "capabilities": {
          "browserName": "chrome"
        }
      }]
    },
    "suites": [
      {
        "name": "Basic Navigation",
        "tests": [
          {
            "name": "Visit Homepage",
            "steps": [
              {
                "command": "navigate",
                "value": "https://example.com"
              },
              {
                "command": "assert-text",
                "selectors": ["h1"],
                "value": "Example Domain"
              }
            ]
          }
        ]
      }
    ]
  }'
```

## Integration Examples

### Node.js

```javascript
const axios = require('axios');
const fs = require('fs');

async function runTests() {
  try {
    const config = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));
    
    const response = await axios.post('http://localhost:8282/run', config, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Test Results:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Test execution failed:', error.response?.data || error.message);
    return false;
  }
}
```

### Python

```python
import requests
import json

def run_tests(config_file):
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    response = requests.post(
        'http://localhost:8282/run',
        json=config,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        results = response.json()
        print(f"Tests completed. Success: {results['success']}")
        return results['success']
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return False
```

### CI/CD Integration

The API can be easily integrated into CI/CD pipelines:

```bash
#!/bin/bash
# Test execution script for CI/CD

# Start the test runner (if not already running)
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run tests
RESULT=$(curl -s -X POST http://localhost:8282/run \
  -H "Content-Type: application/json" \
  -d @e2e-tests.json | jq -r '.success')

# Stop server
kill $SERVER_PID

# Exit with appropriate code
if [ "$RESULT" = "true" ]; then
  echo "All tests passed!"
  exit 0
else
  echo "Tests failed!"
  exit 1
fi
```
