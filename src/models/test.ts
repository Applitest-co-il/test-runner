import { TestDefinitionError } from '../helpers/test-errors';
import { mergeVariables } from '../helpers/utils';
import { logger } from '../helpers/log-service';
import { stepFactory } from './test-step';
import { VideoRecorder } from '../helpers/video-recorder';
import AppActivateStep from './steps/app-activate-step';
import { TrFunction } from './function';
import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { TestConfiguration, TestStep, RunSession, TestRunnerError } from '../types';
import BaseStep from './steps/base-step';
import { TrApi } from './api';
import { ChainablePromiseElement } from 'webdriverio';

interface TestConstructorData extends TestConfiguration {
    id?: string;
    suiteIndex?: number;
    index?: number;
    skip?: boolean;
}

export class Test {
    private readonly _id: string = '';
    private readonly _name: string = '';
    private readonly _type: string = '';
    private readonly _suiteIndex: number = -1;
    private readonly _index: number = -1;
    private readonly _variables: Record<string, string> = {};
    private readonly _skip: boolean = false;
    private readonly _steps: BaseStep[] = [];
    private readonly _savedElements: Record<string, ChainablePromiseElement> = {};
    private _status: string = 'pending';
    private _lastStep: number = 0;
    private _videoRecorder: VideoRecorder | undefined = undefined;

    constructor(test: TestConstructorData) {
        this._id = test.id || '';
        this._name = test.name || '';
        this._type = test.type || '';
        this._suiteIndex = test.suiteIndex ?? -1;
        this._index = test.index ?? -1;
        this._skip = test.skip ?? false;
        this._variables = test.variables ?? {};
        this.buildSteps(test.steps || []);
    }

    private buildSteps(steps: TestStep[]): void {
        if (!steps || steps.length === 0) {
            logger.error(`No test steps found in test "${this._id} - ${this._name}"`);
            return;
        }

        if (!checkArrayMaxItems(steps)) {
            logger.error(`Too many test steps in test "${this._id} - ${this._name}": Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = stepFactory(i + 1, step);
            this._steps.push(testStep);
        }
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get type(): string {
        return this._type;
    }

    get suiteIndex(): number {
        return this._suiteIndex;
    }

    get index(): number {
        return this._index;
    }

    get variables(): Record<string, string> {
        return this._variables;
    }

    get skip(): boolean {
        return this._skip;
    }

    get steps(): BaseStep[] {
        return this._steps;
    }

    get savedElements(): Record<string, ChainablePromiseElement> {
        return this._savedElements;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }

    get lastStep(): number {
        return this._lastStep;
    }

    set lastStep(value: number) {
        this._lastStep = value;
    }

    get videoRecorder(): VideoRecorder | undefined {
        return this._videoRecorder;
    }

    set videoRecorder(value: VideoRecorder | undefined) {
        this._videoRecorder = value;
    }

    async run(
        session: RunSession,
        functions: TrFunction[],
        apis: TrApi[],
        variables: Record<string, string>
    ): Promise<Promise<void>[]> {
        if (!session.driver) {
            throw new TestRunnerError('Test::No driver available to execute test');
        }

        const promises: Promise<void>[] = [];
        TrFunction.functionStacks = [];

        const steps = this._steps;
        if (steps.length === 0) {
            throw new TestDefinitionError(`Test "${this._name}" has no steps`);
        }

        if (session.runConf?.enableVideo) {
            const options = {
                baseName: `${this._suiteIndex}_${this._index}`,
                outputDir: session.runConf.videosPath,
                screenShotInterval: 0
            };
            this._videoRecorder = new VideoRecorder(session.driver, options);
            await this._videoRecorder.start();
        }

        // TBD: change with test type
        if (this._type === 'mobile') {
            const activateAppStep = new AppActivateStep(0, { command: 'app-activate', value: 'current-app' });
            await activateAppStep.run(session, functions, apis, this.variables, {});
        }

        mergeVariables(this._variables, variables);

        const startFromSteps =
            session.runConf?.startFromStep > 0 && session.runConf.startFromStep < steps.length
                ? session.runConf.startFromStep
                : 0;
        const stopAtStep =
            session.runConf?.stopAtStep > startFromSteps && session.runConf.stopAtStep < steps.length
                ? session.runConf.stopAtStep
                : steps.length;

        logger.info(`Starting test "${this._name}" from step ${startFromSteps + 1} to ${stopAtStep + 1}`);

        for (let i = startFromSteps; i < stopAtStep; i++) {
            logger.info(`Running step ${i + 1}`);
            const step = steps[i];

            if (this._videoRecorder) {
                this._videoRecorder.currentStep = step.sequence;
            }

            try {
                const success = await step.run(
                    session,
                    functions,
                    apis,
                    this._variables,
                    this._savedElements,
                    this._videoRecorder
                );
                if (!success) {
                    this._status = 'failed';
                    this._lastStep = i;
                    break;
                }
                mergeVariables(this._variables, step.variables);
            } catch (err) {
                this._status = 'failed';
                this._lastStep = i;
                steps[i].errorDetails = (err as Error).message;
                logger.error(`Error at step ${i + 1}: ${(err as Error).message}`);
                break;
            }
            logger.info(`Step ${i + 1} completed successfully`);
        }
        if (this._status === 'pending') {
            this._status = 'passed';
            this._lastStep = steps.length - 1;
        }

        if (this._videoRecorder) {
            await this._videoRecorder.stop();
            const videoPromise = this._videoRecorder.generateVideo();
            if (videoPromise) {
                logger.info(`Video promise OK for test "${this._suiteIndex}_${this._index}"`);
                promises.push(videoPromise);
            }
        }

        return promises;
    }
}
