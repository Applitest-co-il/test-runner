const { TestDefinitionError } = require('../helpers/test-errors');
const { mergeVariables } = require('../helpers/utils');
const { stepFactory } = require('./test-step');
const VideoRecorder = require('../helpers/video-recorder');
const AppActivateStep = require('./steps/app-activate-step');

class Test {
    #id = '';
    #name = '';
    #type = '';
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
        this.#type = test.type ?? '';
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

    get type() {
        return this.#type;
    }

    get index() {
        return this.#index;
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

    async run(session, variables) {
        const promises = [];

        if (session.runConf.enableVideo) {
            const options = {
                baseName: `${this.#suiteIndex}_${this.#index}`,
                outputDir: session.runConf.videosPath,
                screenShotInterval: 0
            };
            this.#videoRecorder = new VideoRecorder(session.driver, options);
            this.#videoRecorder.start();
        }

        //TBD: chnage with test type
        if (this.type === 'mobile') {
            const activateAppStep = new AppActivateStep(0, { command: 'app-activate', value: 'current-app' });
            await activateAppStep.run(session, this.variables, null);
        }

        const steps = this.#steps;

        mergeVariables(this.#variables, variables);

        if (steps.length == 0) {
            throw new TestDefinitionError(`Test "${this.#name}" has no steps`);
        }

        const startFromSteps =
            session.runConf.startFromStep > 0 && session.runConf.startFromStep < steps.length
                ? session.runConf.startFromStep
                : 0;
        const stopAtStep =
            session.runConf.stopAtStep > startFromSteps && session.runConf.stopAtStep < steps.length
                ? session.runConf.stopAtStep
                : steps.length;

        for (let i = startFromSteps; i < stopAtStep; i++) {
            if (this.#videoRecorder) {
                this.#videoRecorder.currentStep = i + 1;
            }

            const step = steps[i];
            try {
                const success = await step.run(session, this.variables, this.#videoRecorder);
                if (!success) {
                    this.#status = 'failed';
                    this.#lastStep = i;
                    break;
                }
                mergeVariables(this.#variables, step.variables);
            } catch (err) {
                this.#status = 'failed';
                this.#lastStep = i;
                steps[i].errorDetails = err.message;
                break;
            }
        }
        if (this.#status === 'pending') {
            this.#status = 'passed';
            this.#lastStep = steps.length - 1;
        }

        if (this.#videoRecorder) {
            await this.#videoRecorder.stop();
            const videoPromise = this.#videoRecorder.generateVideo();
            if (videoPromise) {
                console.log(`Video promise OK for test "${this.#suiteIndex}_${this.#index}"`);
                promises.push(videoPromise);
            }
        }

        return promises;
    }
}

module.exports = Test;
