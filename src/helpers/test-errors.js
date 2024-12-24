class TestError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class TestAbuseError extends TestError {
    constructor(message) {
        super(message);
    }
}

class TestRunnerConfigurationError extends TestError {
    constructor(message) {
        super(message);
    }
}

class TestRunnerError extends TestError {
    constructor(message) {
        super(message);
    }
}

class TestDefinitionError extends TestError {
    constructor(message) {
        super(message);
    }
}

class TestItemNotFoundError extends TestError {
    constructor(message) {
        super(message);
    }
}

module.exports = {
    TestRunnerConfigurationError,
    TestRunnerError,
    TestDefinitionError,
    TestItemNotFoundError,
    TestAbuseError
};
