const { TestDefinitionError } = require('../helpers/test-errors');
const { mergeVariables } = require('../helpers/utils');
const { stepFactory } = require('./test-step');
const VideoRecorder = require('../helpers/video-recorder');

class Test {
    #id = '';
    #name = '';
    #suiteIndex = -1;
    #index = -1;
    #variables = {};
    #skip = false;

    #steps = [];

    #status = 'pending';
    #lastStep = 0;

    #videoRecorder = null;

    constructor(test) {
        this.#id = test.id ?? '';
        this.#name = test.name ?? '';
        this.#suiteIndex = test.suiteIndex ?? -1;
        this.#index = test.index ?? -1;
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
            let testStep = stepFactory(i, step);
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
        const promises = [];

        if (conf.enableVideo) {
            const options = {
                baseName: `${this.#suiteIndex}_${this.#index}`,
                outputDir: process.env.DEVICEFARM_LOG_DIR
                    ? `${process.env.DEVICEFARM_LOG_DIR}/videos`
                    : `${process.cwd()}/reports/videos`,
                screenShotInterval: 0
            };
            this.#videoRecorder = new VideoRecorder(driver, options);
            this.#videoRecorder.start();
        }

        const steps = this.#steps;

        mergeVariables(this.#variables, variables);

        if (steps.length == 0) {
            throw new TestDefinitionError(`Test "${this.#name}" has no steps`);
        }

        const startFromSteps = conf.startFromStep > 0 && conf.startFromStep < steps.length ? conf.startFromStep : 0;
        const stopAtStep =
            conf.stopAtStep > startFromSteps && conf.stopAtStep < steps.length ? conf.stopAtStep : steps.length;

        for (let i = startFromSteps; i < stopAtStep; i++) {
            if (this.#videoRecorder) {
                this.#videoRecorder.currentStep = i + 1;
            }

            const step = steps[i];
            const success = await step.run(driver, this.variables, conf, this.#videoRecorder);
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

        if (this.#videoRecorder) {
            await this.#videoRecorder.stop();
            const videoPromise = this.#videoRecorder.generateVideo();
            if (videoPromise) {
                promises.push(videoPromise);
            }
        }

        return promises;
    }
}

module.exports = Test;
