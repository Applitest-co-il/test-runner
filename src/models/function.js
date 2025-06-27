const { stepFactory } = require('./test-step');
const FunctionStep = require('./steps/function-step');
const { TestDefinitionError, TestRunnerError } = require('../helpers/test-errors');

class TrFunction {
    #id = '';
    #name = '';
    #type = '';
    #properties = [];
    #outputs = [];
    #steps = [];

    #savedElements = {};

    constructor(func) {
        this.#id = func.id ?? '';
        this.#name = func.name ?? '';
        this.#type = func.type ?? '';
        this.#properties = func.properties ?? [];
        this.#outputs = func.outputs ?? [];
        this.#buildSteps(func.steps);
    }

    static functionStacks = [];

    #buildSteps(steps) {
        if (!steps || steps.length === 0) {
            console.error('No test steps found');
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = stepFactory(i + 1, step);
            this.#steps.push(testStep);
        }
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get type() {
        return this.#type;
    }

    get savedElements() {
        return this.#savedElements;
    }

    get properties() {
        return this.#properties;
    }

    duplicate() {
        // Create new function with basic properties but empty steps
        const newFunction = new TrFunction({
            id: this.#id,
            name: this.#name,
            type: this.#type,
            properties: [...this.#properties],
            outputs: [...this.#outputs],
            steps: [] // Start with empty steps array
        }); // Rebuild steps using the original raw data from each step
        newFunction.#steps = this.#steps.map((step, index) => {
            // Get the raw configuration and create a deep copy
            const rawData = JSON.parse(JSON.stringify(step.rawData));
            // Use stepFactory to create a new instance
            return stepFactory(index + 1, rawData);
        });

        newFunction.#savedElements = { ...this.#savedElements };
        return newFunction;
    }

    async run(session, propertiesValues, functions, apis, videoRecorder, videoBaseStep) {
        TrFunction.functionStacks.push(this.id);

        const steps = this.#steps;

        if (steps.length == 0) {
            throw new TestDefinitionError(`Function "${this.#name}" has no steps`);
        }

        let actualProperties = {};
        if (
            propertiesValues === undefined ||
            (propertiesValues && propertiesValues.length != this.#properties.length)
        ) {
            const inputProperties = propertiesValues ? propertiesValues.join(',') : [];
            throw new TestDefinitionError(
                `Missing properties values for function "${this.#name}": expecting "${this.#properties.join(',')}" and received "${inputProperties}"`
            );
        }

        for (let i = 0; i < this.#properties.length; i++) {
            const prop = this.#properties[i];
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
                    const functionId = step.value.split('|||')[0];
                    if (TrFunction.functionStacks.includes(functionId)) {
                        throw new TestRunnerError(
                            `Function "${functionId}" is up in function stack and called again creating a forbidden loop.`
                        );
                    }
                }

                videoRecorder.currentStep = `${videoBaseStep}_${step.sequence}`;

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
                    error: err.message
                };
            }
        }

        let outputs = null;
        if (this.#outputs.length > 0) {
            outputs = {};
            for (let i = 0; i < this.#outputs.length; i++) {
                const prop = this.#outputs[i];
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

module.exports = TrFunction;
