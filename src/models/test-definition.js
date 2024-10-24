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

    constructor(test) {
        this.#id = test.id ?? '';
        this.#name = test.name ?? '';
        this.#skip = test.skip ?? false;
        this.#variables = test.variables ?? {};
        this.#buildSteps(test.steps);
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

    async run(driver, variables, conf) {
        const steps = this.#steps;

        mergeVariables(this.#variables, variables);

        if (steps.length == 0) {
            throw new TestDefinitionError(`Test "${this.#name}" has no steps`);
        }

        const startFromSteps = conf.startFromStep > 0 && conf.startFromStep < steps.length ? conf.startFromStep : 0;
        const stopAtStep =
            conf.stopAtStep > startFromSteps && conf.stopAtStep < steps.length ? conf.stopAtStep : steps.length;

        for (let i = startFromSteps; i < stopAtStep; i++) {
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
