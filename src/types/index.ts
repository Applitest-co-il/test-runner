// Core type definitions for Applitest Test Runner

export interface TestRunConfiguration {
    name: string;
    description?: string;
    sessions: SessionConfiguration[];
    variables?: Record<string, any>;
    functions?: FunctionConfiguration[];
    apis?: ApiConfiguration[];
}

export interface SessionConfiguration {
    runType: 'web' | 'mobile' | 'api';
    browser?: string;
    capabilities?: WebDriverCapabilities;
    tests: TestConfiguration[];
    currentAxTree?: AccessibilityTree | null;
    type?: string;
    driver?: any;
}

export interface TestConfiguration {
    name: string;
    description?: string;
    steps: TestStep[];
    savedElements?: Record<string, any>;
    variables?: Record<string, any>;
    functions?: Record<string, any>;
}

export interface TestStep {
    command: string;
    value?: string;
    operator?: string;
    description?: string;
    conditions?: TestCondition[];
    outputs?: OutputVariable[];
    sequence?: number;
    takeSnapshot?: boolean;
    selectors?: string[];
    namedElement?: string;
    position?: number;
}

export interface TestCondition {
    type: 'exist' | 'not-exist' | 'value' | 'script' | 'browser';
    selector?: string;
    value?: string;
    script?: string;
    browser?: string;
}

export interface OutputVariable {
    name: string;
    value?: string;
    selector?: string;
    attribute?: string;
    property?: string;
}

export interface FunctionConfiguration {
    name: string;
    parameters?: string[];
    steps: TestStep[];
}

export interface ApiConfiguration {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    data?: any;
    schema?: any;
}

export interface WebDriverCapabilities {
    browserName?: string;
    platformName?: string;
    platformVersion?: string;
    deviceName?: string;
    app?: string;
    automationName?: string;
    [key: string]: any;
}

export interface AccessibilityTree {
    timestamp: string;
    url: string;
    type: 'cdp' | 'fallback' | 'puppeteer' | 'error';
    tree: any;
    metadata?: AccessibilityMetadata;
    error?: string;
}

export interface AccessibilityMetadata {
    viewport?: { width: number; height: number };
    userAgent?: string;
    title?: string;
    nodeCount?: number;
    selector?: string;
    startElement?: string;
    extractionMethod?: string;
}

export interface TestResult {
    runCompleted: boolean;
    success: boolean;
    executionTime: number;
    summary: TestSummary;
    suiteResults: SuiteResult[];
}

export interface SuiteResult {
    success: boolean;
    summary: TestSummary;
    tests: TestExecutionResult[];
    suiteResult?: SuiteResult;
}

export interface TestExecutionResult {
    name: string;
    success: boolean;
    error?: string;
    executionTime: number;
    steps: StepResult[];
}

export interface StepResult {
    command: string;
    success: boolean;
    error?: string;
    executionTime: number;
    snapshot?: string;
}

export interface TestSummary {
    suites?: number;
    passedSuites?: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
}

export interface SessionCache {
    sessionId: string;
    testRunner: any; // Will be typed when TestRunner is converted
    savedElements: Record<string, any>;
}

export interface ApiCallOptions {
    outputs?: OutputVariable[];
    url: string;
    method: string;
    headers?: string;
    data?: string;
    schema?: any;
}

export interface ExtendedBrowser {
    capabilities: WebDriverCapabilities;
    getPuppeteer(): Promise<any>;
    call<T>(callback: () => Promise<T>): Promise<T>;
    execute<T>(script: string | ((...args: any[]) => T), ...args: any[]): Promise<T>;
    executeAsync<T>(script: string | ((...args: any[]) => T), ...args: any[]): Promise<T>;
    url(url: string): Promise<void>;
    newWindow(url: string): Promise<void>;
    getTitle(): Promise<string>;
    $(selector: string): Promise<any>;
    $$(selector: string): Promise<any[]>;
    [key: string]: any;
}

export interface ElementInfo {
    tagName: string;
    role: string;
    name: string;
    description: string;
    level?: string;
    expanded?: string;
    checked?: string;
    selected?: string;
    pressed?: string;
    orientation?: string;
    disabled: boolean;
    hidden: boolean;
    readonly: boolean;
    required: boolean;
    focusable: boolean;
    tabIndex: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    id?: string;
    className?: string;
    children: ElementInfo[];
}

export interface DomTreeResult {
    type: 'fallback' | 'error' | 'native';
    data: ElementInfo | null;
    metadata?: {
        url: string;
        title: string;
        timestamp: string;
        userAgent: string;
        viewport: { width: number; height: number };
        selector?: string;
        startElement?: string;
    };
    error?: string;
}

// Error types
export class TestRunnerConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestRunnerConfigurationError';
    }
}

export class TestRunnerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestRunnerError';
    }
}

export class TestDefinitionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestDefinitionError';
    }
}

export class TestItemNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestItemNotFoundError';
    }
}

export class TestAbuseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestAbuseError';
    }
}
