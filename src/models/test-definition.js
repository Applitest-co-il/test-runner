const { TestDefinitionError } = require('../helpers/test-errors');
const { mergeVariables } = require('../helpers/utils');
const TestStep = require('./test-step');

class TestDefinition {
    #id = '';
    #name = '';
    #variables = {};
    #skip = false;

    #steps = [];

    #status = 'pending';
    #lastStep = 0;

    constructor(options) {
        this.#id = options.id ?? '';
        this.#name = options.name ?? '';
        this.#skip = options.skip ?? false;
        this.#variables = options.variables ?? {};
        this.#buildSteps(options.steps);
    }

    #buildSteps(steps) {
        if (!steps || steps.length === 0) {
            console.error('No test steps found');
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = new TestStep(i + 1, step);
            this.#steps.push(testStep);
        }
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get skip() {
        return this.#skip;
    }

    get steps() {
        return this.#steps;
    }

    get status() {
        return this.#status;
    }

    get lastStep() {
        return this.#lastStep;
    }

    get errorDetails() {
        if (this.#status === 'failed') {
            return this.#steps[this.#lastStep].errorDetails;
        }

        return '';
    }

    get variables() {
        return this.#variables;
    }

    async run(driver, variables) {
        const steps = this.#steps;

        mergeVariables(this.#variables, variables);

        if (steps.length == 0) {
            throw new TestDefinitionError(`Test "${this.#name}" has no steps`);
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const success = await step.run(driver, this.variables);
            if (!success) {
                this.#status = 'failed';
                this.#lastStep = i;
                break;
            }
            mergeVariables(this.#variables, step.variables);
        }
        if (this.#status === 'pending') {
            this.#status = 'passed';
            this.#lastStep = steps.length - 1;
        }
    }
}

module.exports = TestDefinition;
