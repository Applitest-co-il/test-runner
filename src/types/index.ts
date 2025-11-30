// Core type definitions for Applitest Test

import { Browser, ChainablePromiseElement } from 'webdriverio';
import DriverConfiguration from '../models/configuration/base-driver-configuration';
import { TrFunction } from '../models/function';

//#region Configuration

export interface TestRunnerOptions {
    runConfiguration?: RunConfiguration;
    variables?: Record<string, string>;
    suites?: SuiteConfiguration[];
    functions?: FunctionConfiguration[];
    apis?: ApiConfiguration[];
}

export interface RunConfiguration {
    runName: string;
    runType?: 'web' | 'mobile' | 'api' | 'mixed';
    organization?: string;
    description?: string;
    sessions: SessionConfiguration[];
    startFromStep?: number;
    stopAtStep?: number;
    keepSession?: boolean;
    enableVideo?: boolean;
    videosPath?: string;
    noFollowReset?: boolean;
    farm?: string;
    user?: string;
    user_key?: string;
    host?: string;
    port?: number;
    logLevel?: string;
}

export interface SessionConfiguration {
    type: 'web' | 'mobile' | 'api';
    browser?: any;
    appium?: any;
    capabilities?: WebDriverCapabilities;
}

export interface SuiteConfiguration {
    name: string;
    description?: string;
    tests: TestConfiguration[];
}

export interface TestConfiguration {
    name: string;
    description?: string;
    type: string;
    steps: TestStep[];
    savedElements?: Record<string, ChainablePromiseElement>;
    variables?: Record<string, string>;
    functions?: Record<string, TrFunction>;
}

export interface TestStep {
    command: string;
    value?: string;
    operator?: string;
    description?: string;
    condition?: TestCondition;
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
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    headers?: Record<string, string>;
    body?: any;
    schema?: any;
    properties?: string[];
    outputs?: OutputVariable[];
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

export interface RunSession {
    type: string;
    runConf: DriverConfiguration;
    driver?: Browser;
}

//#endregion

//#region Web Page description

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

//#endregion

//#region Results

//result if full run
export interface RunSummary {
    suites?: number;
    passedSuites?: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
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

export interface RunResult {
    runCompleted: boolean;
    success: boolean;
    executionTime: number;
    summary?: RunSummary;
    suiteResults?: SuiteResult[];
    error?: string;
}

export interface SessionResult {
    success: boolean;
    message?: string;
    executionTime?: number;
    sessionId?: string;
    suiteResult?: SuiteResult;
    tree?: any;
}

export interface SuiteResult {
    id: string;
    name: string;
    index: number;
    success: boolean;
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        pending: number;
    };
    details: TestDetail[];
}

export interface TestDetail {
    id: string;
    suiteId: string;
    suiteIdx: number;
    suiteName: string;
    index: number;
    type: string;
    name: string;
    status: string;
    failedStep: FailedStepDetail;
    error: string;
}

export interface FailedStepDetail {
    sequence?: number;
    command?: string;
    target?: string;
    error?: string;
    url?: string;
}

//#region API Call Result

export interface ApiCallResult {
    success: boolean;
    statusCode?: number;
    statusText?: string;
    headers?: any;
    responseBody?: any;
    schemaValidation: boolean;
    schemaValidationErrors: SchemaValidationError[];
    outputs?: Record<string, string>;
    error?: string;
}

export interface SchemaValidationError {
    message?: string;
    dataPath?: string;
    schemaPath?: string;
}

//#endregion

//#region Functions

export interface FunctionResult {
    success: boolean;
    failedStep?: number;
    error?: string;
    outputs?: Record<string, string> | null;
}

//#endregion

//#endregion

export interface ApiCallOptions {
    outputs?: OutputVariable[];
    url: string;
    method: string;
    headers?: string;
    data?: string;
    schema?: any;
}

//#region Error types

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

//#endregion
