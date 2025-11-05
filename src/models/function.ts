import { stepFactory } from './test-step';
import FunctionStep from './steps/function-step';
import { TestDefinitionError, TestRunnerError } from '../helpers/test-errors';
import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { FunctionConfiguration, SessionConfiguration, TestStep } from '../types';

interface FunctionRunResult {
    success: boolean;
    failedStep?: number;
    error?: string;
    outputs?: Record<string, any> | null;
}

export class TrFunction {
    private readonly id: string = '';
    private readonly name: string = '';
    private readonly type: string = '';
    private readonly properties: string[] = [];
    private readonly outputs: string[] = [];
    private readonly steps: any[] = []; // Will be typed when TestStep is converted
    private savedElements: Record<string, any> = {};

    static functionStacks: string[] = [];

    constructor(
        func: FunctionConfiguration & {
            id?: string;
            type?: string;
            properties?: string[];
            outputs?: string[];
        }
    ) {
        this.id = func.id ?? '';
        this.name = func.name ?? '';
        this.type = func.type ?? '';
        this.properties = func.properties ?? [];
        this.outputs = func.outputs ?? [];
        this.buildSteps(func.steps || []);
    }

    private buildSteps(steps: TestStep[]): void {
        if (!checkArrayMaxItems(steps)) {
            console.error(
                `Too many test steps in function "${this.id} - ${this.name}": Maximum allowed is ${MAX_ITEMS}`
            );
            return;
        }

        if (steps.length === 0) {
            console.error(`No test steps found in function "${this.id} - ${this.name}"`);
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = stepFactory(i + 1, step);
            this.steps.push(testStep);
        }
    }

    get getId(): string {
        return this.id;
    }

    get getName(): string {
        return this.name;
    }

    get getType(): string {
        return this.type;
    }

    get getSavedElements(): Record<string, any> {
        return this.savedElements;
    }

    get getProperties(): string[] {
        return this.properties;
    }

    duplicate(): TrFunction {
        // Create new function with basic properties
        const steps = this.steps.map((step) => {
            // Create a deep copy of the step's raw data
            return JSON.parse(JSON.stringify(step.rawData));
        });
        const newFunction = new TrFunction({
            id: this.id,
            name: this.name,
            type: this.type,
            properties: [...this.properties],
            outputs: [...this.outputs],
            steps: steps
        });

        newFunction.savedElements = { ...this.savedElements };
        return newFunction;
    }

    async run(
        session: SessionConfiguration,
        propertiesValues: string[],
        functions: Record<string, TrFunction>,
        apis: Record<string, any>,
        videoRecorder?: any,
        videoBaseStep?: string
    ): Promise<FunctionRunResult> {
        TrFunction.functionStacks.push(this.id);

        const steps = this.steps;

        if (steps.length === 0) {
            throw new TestDefinitionError(`Function "${this.name}" has no steps`);
        }

        let actualProperties: Record<string, string> = {};
        if (
            propertiesValues === undefined ||
            (propertiesValues && propertiesValues.length !== this.properties.length)
        ) {
            const inputProperties = propertiesValues ? propertiesValues.join(',') : [];
            throw new TestDefinitionError(
                `Missing properties values for function "${this.name}": expecting "${this.properties.join(',')}" and received "${inputProperties}"`
            );
        }

        for (let i = 0; i < this.properties.length; i++) {
            const prop = this.properties[i];
            const value = propertiesValues[i].trim();
            if (value === undefined) {
                throw new TestDefinitionError(`Missing property value for "${prop}"`);
            }
            actualProperties[prop] = value;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            try {
                if (step instanceof FunctionStep) {
                    const functionValue = (step as any).value;
                    if (typeof functionValue === 'string') {
                        const functionId = functionValue.split('|||')[0];
                        if (functionId && TrFunction.functionStacks.includes(functionId)) {
                            throw new TestRunnerError(
                                `Function "${functionId}" is up in function stack and called again creating a forbidden loop.`
                            );
                        }
                    }
                }

                if (videoRecorder) {
                    videoRecorder.currentStep = `${videoBaseStep}_${step.sequence}`;
                }

                const success = await step.run(
                    session,
                    functions,
                    apis,
                    actualProperties,
                    this.savedElements,
                    videoRecorder,
                    `${videoBaseStep}_`
                );
                if (!success) {
                    return {
                        success: false,
                        failedStep: i,
                        error: step.errorDetails
                    };
                }
            } catch (err) {
                return {
                    success: false,
                    failedStep: i + 1,
                    error: (err as Error).message
                };
            }
        }

        let outputs: Record<string, any> | null = null;
        if (this.outputs.length > 0) {
            outputs = {};
            for (let i = 0; i < this.outputs.length; i++) {
                const prop = this.outputs[i];
                outputs[prop] = actualProperties[prop];
            }
        }

        TrFunction.functionStacks.pop();

        return {
            success: true,
            outputs: outputs
        };
    }
}
