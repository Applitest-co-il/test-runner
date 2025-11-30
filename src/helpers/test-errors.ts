export class TestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class TestAbuseError extends TestError {
    constructor(message: string) {
        super(message);
    }
}

export class TestRunnerConfigurationError extends TestError {
    constructor(message: string) {
        super(message);
    }
}

export class TestRunnerError extends TestError {
    constructor(message: string) {
        super(message);
    }
}

export class TestDefinitionError extends TestError {
    constructor(message: string) {
        super(message);
    }
}

export class TestItemNotFoundError extends TestError {
    constructor(message: string) {
        super(message);
    }
}
