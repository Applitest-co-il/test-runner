const TestStep = require('./test-step');

class TestDefinition {
    #name = '';
    #skip = false;

    #steps = [];

    #status = 'pending';
    #lastStep = 0;

    constructor(options) {
        this.#name = options.name;
        this.#skip = options.skip ?? false;
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

    async run(driver) {
        const steps = this.#steps;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const success = await step.run(driver);
            if (!success) {
                this.#status = 'failed';
                this.#lastStep = i;
                break;
            }
        }
        if (this.#status === 'pending') {
            this.#status = 'passed';
            this.#lastStep = steps.length - 1;
        }
    }
}

module.exports = TestDefinition;
