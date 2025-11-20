import { stepFactory } from './test-step';
import FunctionStep from './steps/function-step';
import { TestDefinitionError, TestRunnerError } from '../helpers/test-errors';
import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { FunctionConfiguration, FunctionResult, TestStep, RunSession } from '../types';
import BaseStep from './steps/base-step';
import { TrApi } from './api';
import { VideoRecorder } from '../helpers/video-recorder';

export class TrFunction {
    private readonly _id: string = '';
    private readonly _name: string = '';
    private readonly _type: string = '';
    private readonly _properties: string[] = [];
    private readonly _outputs: string[] = [];
    private readonly _steps: BaseStep[] = []; // Will be typed when TestStep is converted
    private _savedElements: Record<string, any> = {};

    static functionStacks: string[] = [];

    constructor(
        func: FunctionConfiguration & {
            id?: string;
            type?: string;
            properties?: string[];
            outputs?: string[];
        }
    ) {
        this._id = func.id ?? '';
        this._name = func.name ?? '';
        this._type = func.type ?? '';
        this._properties = func.properties ?? [];
        this._outputs = func.outputs ?? [];
        this.buildSteps(func.steps || []);
    }

    //#region Getters and Setters
    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get type(): string {
        return this._type;
    }

    get properties(): string[] {
        return this._properties;
    }

    get outputs(): string[] {
        return this._outputs;
    }

    get steps(): BaseStep[] {
        return this._steps;
    }

    get savedElements(): Record<string, any> {
        return this._savedElements;
    }

    set savedElements(value: Record<string, any>) {
        this._savedElements = value;
    }

    get getId(): string {
        return this._id;
    }

    get getName(): string {
        return this._name;
    }

    get getType(): string {
        return this._type;
    }

    get getSavedElements(): Record<string, any> {
        return this._savedElements;
    }

    get getProperties(): string[] {
        return this._properties;
    }
    //#endregion

    private buildSteps(steps: TestStep[]): void {
        if (!checkArrayMaxItems(steps)) {
            console.error(
                `Too many test steps in function "${this._id} - ${this._name}": Maximum allowed is ${MAX_ITEMS}`
            );
            return;
        }

        if (steps.length === 0) {
            console.error(`No test steps found in function "${this._id} - ${this._name}"`);
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = stepFactory(i + 1, step);
            this._steps.push(testStep);
        }
    }

    duplicate(): TrFunction {
        // Create new function with basic properties
        const steps = this._steps.map((step) => {
            // Create a deep copy of the step's raw data
            return JSON.parse(JSON.stringify(step.rawData));
        });
        const newFunction = new TrFunction({
            id: this._id,
            name: this._name,
            type: this._type,
            properties: [...this._properties],
            outputs: [...this._outputs],
            steps: steps
        });

        newFunction._savedElements = { ...this._savedElements };
        return newFunction;
    }

    async run(
        session: RunSession,
        propertiesValues: string[],
        functions: TrFunction[],
        apis: TrApi[],
        videoRecorder?: VideoRecorder,
        videoBaseStep?: string
    ): Promise<FunctionResult> {
        TrFunction.functionStacks.push(this._id);

        const steps = this._steps;

        if (steps.length === 0) {
            throw new TestDefinitionError(`Function "${this._name}" has no steps`);
        }

        let actualProperties: Record<string, string> = {};
        if (
            propertiesValues === undefined ||
            (propertiesValues && propertiesValues.length !== this._properties.length)
        ) {
            const inputProperties = propertiesValues ? propertiesValues.join(',') : [];
            throw new TestDefinitionError(
                `Missing properties values for function "${this._name}": expecting "${this._properties.join(',')}" and received "${inputProperties}"`
            );
        }

        for (let i = 0; i < this._properties.length; i++) {
            const prop = this._properties[i];
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
        if (this._outputs.length > 0) {
            outputs = {};
            for (let i = 0; i < this._outputs.length; i++) {
                const prop = this._outputs[i];
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
