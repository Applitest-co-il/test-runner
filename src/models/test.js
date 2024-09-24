const { TestDefinitionError } = require('../helpers/test-errors');
const { mergeVariables } = require('../helpers/utils');
const TestStep = require('./test-step');
const VideoRecorder = require('../helpers/video-recorder');

class Test {
    #conf = null;
    #id = '';
    #name = '';
    #variables = {};
    #skip = false;

    #steps = [];

    #status = 'pending';
    #lastStep = 0;

    #videoRecorder = null;

    constructor(test, conf) {
        this.#conf = conf;
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
            let testStep = new TestStep(i + 1, step, this.#conf);
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
        const promises = [];

        if (this.#conf.enableVideo) {
            const options = {
                baseName: this.#name,
                outputDir: `${process.cwd()}/reports/videos`,
                screenShotInterval: 250
            };
            this.#videoRecorder = new VideoRecorder(driver, options);
            this.#videoRecorder.start();
        }

        const steps = this.#steps;

        mergeVariables(this.#variables, variables);

        if (steps.length == 0) {
            throw new TestDefinitionError(`Test "${this.#name}" has no steps`);
        }

        const startFromSteps =
            this.#conf.startFromStep > 0 && this.#conf.startFromStep < steps.length ? this.#conf.startFromStep : 0;
        const stopAtStep =
            this.#conf.stopAtStep > startFromSteps && this.#conf.stopAtStep < steps.length
                ? this.#conf.stopAtStep
                : steps.length;

        for (let i = startFromSteps; i < stopAtStep; i++) {
            if (this.#videoRecorder) {
                this.#videoRecorder.currentStep = i + 1;
            }

            const step = steps[i];
            const success = await step.run(driver, this.variables);
            if (!success) {
                this.#status = 'failed';
                this.#lastStep = i;
                break;
            }
            mergeVariables(this.#variables, step.variables);

            if (this.#videoRecorder) {
                await this.#videoRecorder.addFrame();
            }
        }
        if (this.#status === 'pending') {
            this.#status = 'passed';
            this.#lastStep = steps.length - 1;
        }

        if (this.#videoRecorder) {
            await this.#videoRecorder.stop();
            const videoPromise = await this.#videoRecorder.generateVideo();
            if (videoPromise) {
                promises.push(videoPromise);
            }
        }

        return promises;
    }
}

module.exports = Test;
