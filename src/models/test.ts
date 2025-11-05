import { TestDefinitionError } from '../helpers/test-errors';
import { mergeVariables } from '../helpers/utils';
import { stepFactory } from './test-step';
import { VideoRecorder } from '../helpers/video-recorder';
import AppActivateStep from './steps/app-activate-step';
import { TrFunction } from './function';
import { checkArrayMaxItems, MAX_ITEMS } from '../helpers/security';
import { TestConfiguration, SessionConfiguration, TestStep } from '../types';

interface TestConstructorData extends TestConfiguration {
    id?: string;
    suiteIndex?: number;
    index?: number;
    skip?: boolean;
}

export class Test {
    private readonly id: string = '';
    private readonly name: string = '';
    private readonly type: string = '';
    private readonly suiteIndex: number = -1;
    private readonly index: number = -1;
    private readonly variables: Record<string, any> = {};
    private readonly skip: boolean = false;
    private readonly steps: any[] = []; // Will be typed when step classes are converted
    private readonly savedElements: Record<string, any> = {};
    private readonly context: Record<string, any> = {};
    private status: string = 'pending';
    private lastStep: number = 0;
    private videoRecorder: VideoRecorder | null = null;

    constructor(test: TestConstructorData) {
        this.id = test.id || '';
        this.name = test.name || '';
        this.type = test.description || ''; // Assuming type maps to description
        this.suiteIndex = test.suiteIndex ?? -1;
        this.index = test.index ?? -1;
        this.skip = test.skip ?? false;
        this.variables = test.variables ?? {};
        this.buildSteps(test.steps || []);
    }

    private buildSteps(steps: TestStep[]): void {
        if (!steps || steps.length === 0) {
            console.error(`No test steps found in test "${this.id} - ${this.name}"`);
            return;
        }

        if (!checkArrayMaxItems(steps)) {
            console.error(`Too many test steps in test "${this.id} - ${this.name}": Maximum allowed is ${MAX_ITEMS}`);
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            let testStep = stepFactory(i + 1, step);
            this.steps.push(testStep);
        }
    }

    get getId(): string {
        return this.id;
    }

    get getName(): string {
        return this.name;
    }

    get getType(): string {
        return this.type;
    }

    get getIndex(): number {
        return this.index;
    }

    get getSkip(): boolean {
        return this.skip;
    }

    get getSteps(): any[] {
        return this.steps;
    }

    get getStatus(): string {
        return this.status;
    }

    get getLastStep(): number {
        return this.lastStep;
    }

    get getErrorDetails(): string {
        if (this.status === 'failed') {
            return this.steps[this.lastStep].errorDetails;
        }
        return '';
    }

    get getVariables(): Record<string, any> {
        return this.variables;
    }

    get getSavedElements(): Record<string, any> {
        return this.savedElements;
    }

    async run(
        session: SessionConfiguration,
        functions: Record<string, TrFunction>,
        apis: Record<string, any>,
        variables: Record<string, any>
    ): Promise<Promise<void>[]> {
        const promises: Promise<void>[] = [];
        TrFunction.functionStacks = [];

        const steps = this.steps;
        if (steps.length === 0) {
            throw new TestDefinitionError(`Test "${this.name}" has no steps`);
        }

        if ((session as any).runConf?.enableVideo) {
            const options = {
                baseName: `${this.suiteIndex}_${this.index}`,
                outputDir: (session as any).runConf.videosPath,
                screenShotInterval: 0
            };
            this.videoRecorder = new VideoRecorder(session.driver, options);
            await this.videoRecorder.start();
        }

        // TBD: change with test type
        if (this.type === 'mobile') {
            const activateAppStep = new AppActivateStep(0, { command: 'app-activate', value: 'current-app' });
            await activateAppStep.run(session, this.variables, functions, apis, {});
        }

        mergeVariables(this.variables, variables);

        const startFromSteps =
            (session as any).runConf?.startFromStep > 0 && (session as any).runConf.startFromStep < steps.length
                ? (session as any).runConf.startFromStep
                : 0;
        const stopAtStep =
            (session as any).runConf?.stopAtStep > startFromSteps && (session as any).runConf.stopAtStep < steps.length
                ? (session as any).runConf.stopAtStep
                : steps.length;

        console.log(`Starting test "${this.name}" from step ${startFromSteps + 1} to ${stopAtStep + 1}`);

        for (let i = startFromSteps; i < stopAtStep; i++) {
            console.log(`Running step ${i + 1}`);
            const step = steps[i];

            if (this.videoRecorder) {
                this.videoRecorder.currentStep = step.sequence;
            }

            try {
                const success = await step.run(
                    session,
                    functions,
                    apis,
                    this.variables,
                    this.savedElements,
                    this.videoRecorder
                );
                if (!success) {
                    this.status = 'failed';
                    this.lastStep = i;
                    break;
                }
                mergeVariables(this.variables, step.variables);
            } catch (err) {
                this.status = 'failed';
                this.lastStep = i;
                steps[i].errorDetails = (err as Error).message;
                console.error(`Error at step ${i + 1}: ${(err as Error).message}`);
                break;
            }
            console.log(`Step ${i + 1} completed successfully`);
        }
        if (this.status === 'pending') {
            this.status = 'passed';
            this.lastStep = steps.length - 1;
        }

        if (this.videoRecorder) {
            await this.videoRecorder.stop();
            const videoPromise = this.videoRecorder.generateVideo();
            if (videoPromise) {
                console.log(`Video promise OK for test "${this.suiteIndex}_${this.index}"`);
                promises.push(videoPromise);
            }
        }

        return promises;
    }
}
