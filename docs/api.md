# API Documentation

The Applitest Test Runner provides a REST API for executing tests and managing test configurations.

## Base URL

When running locally:

```text
http://localhost:3000
```

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
  "version": "0.9.80"
}
```

### PATCH /test-runner

Executes a test configuration and returns the results.

**Request:**

```bash
curl -X PATCH http://localhost:3000/test-runner \
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
curl -X PATCH http://localhost:3000/test-runner \
  -H "Content-Type: application/json" \
  -d '{
    "runConfiguration": {
      "runType": "web",
      "selenium": {
        "browserName": "chrome",
        "host": "localhost",
        "port": 4444
      }
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

### Running from Configuration File

```bash
curl -X PATCH http://localhost:3000/test-runner \
  -H "Content-Type: application/json" \
  -d @samples/json/web1.json
```

## Integration Examples

### Node.js

```javascript
const axios = require('axios');
const fs = require('fs');

async function runTests() {
  try {
    const config = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));
    
    const response = await axios.patch('http://localhost:3000/test-runner', config, {
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
    
    response = requests.patch(
        'http://localhost:3000/test-runner',
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
RESULT=$(curl -s -X PATCH http://localhost:3000/test-runner \
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