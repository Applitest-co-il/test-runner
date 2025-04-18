const { stepFactory } = require('./test-step');
const { TestDefinitionError } = require('../helpers/test-errors');

class TrFunction {
    #id = '';
    #name = '';
    #type = '';
    #properties = [];
    #variables = {};
    #steps = [];

    #savedElements = {};

    constructor(func) {
        this.#id = func.id ?? '';
        this.#name = func.name ?? '';
        this.#type = func.type ?? '';
        this.#properties = func.properties ?? [];
        this.#variables = func.variables ?? {};
        this.#buildSteps(func.steps);
    }

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

    get variables() {
        return this.#variables;
    }

    get savedElements() {
        return this.#savedElements;
    }

    async run(session, propertiesValues, functions, videoRecorder) {
        const steps = this.#steps;

        if (steps.length == 0) {
            throw new TestDefinitionError(`Function "${this.#name}" has no steps`);
        }

        const actualProperties = {};
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
                const success = await step.run(session, functions, actualProperties, this.savedElements, videoRecorder);
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

        return {
            success: true
        };
    }
}

module.exports = TrFunction;
