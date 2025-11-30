import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { Jimp } from 'jimp';
import { Browser } from 'webdriverio';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { logger } from './log-service';

interface VideoRecorderOptions {
    outputDir?: string;
    baseName?: string;
}

export class VideoRecorder {
    private outputDir: string = '';
    private baseName: string = 'video';
    private driver: Browser | null = null;
    private frameCount: number = 0;
    private currentStepValue: number | string = 0;
    private recordingPath: string = '';

    constructor(driver: Browser, options: VideoRecorderOptions = {}) {
        if (!driver) {
            throw new Error('VideoRecorder:Driver is required');
        }
        this.driver = driver;

        if (options.outputDir) {
            this.outputDir = options.outputDir;
        }
        if (options.baseName) {
            this.baseName = options.baseName.trim().replace(/\s/g, '_');
        }
    }

    set currentStep(step: number | string) {
        this.currentStepValue = step;
    }

    async start(): Promise<void> {
        logger.info(`Starting video recording ${this.baseName}...`);

        try {
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
            this.recordingPath = `${this.outputDir}/${this.baseName}`;
            if (fs.existsSync(this.recordingPath)) {
                fs.rmSync(this.recordingPath, { recursive: true });
            }
            fs.mkdirSync(this.recordingPath, { recursive: true });
        } catch (err) {
            logger.error(`Video Recorder: Error creating recording directory for ${this.recordingPath}: ${err}`);
            this.recordingPath = '';
            return;
        }

        this.frameCount = 0;
        this.currentStepValue = '00';
        await this.addFrame();
    }

    async stop(): Promise<void> {
        logger.info('Stopping video recording...');
    }

    generateVideo(): Promise<void> | null {
        logger.info(`Generating video for ${this.baseName}...`);

        try {
            const fileExtension = 'mp4';
            const vcodec = 'libx264';
            const videoPath = path.resolve(this.outputDir, `${this.baseName}.${fileExtension}`);

            let command = process.env.FFMPEG_PATH;
            if (!command) {
                command = ffmpeg.path;
            }

            const args = [
                '-y',
                '-framerate 1',
                `-i "${this.recordingPath}/%6d.png"`,
                `-c:v ${vcodec}`,
                '-pix_fmt yuv420p',
                '-r 25',
                `"${videoPath}"`
            ];
            logger.info(`Video generation for ${this.baseName} ffmpeg command: ${command} ${args.join(' ')}`);

            const start = Date.now();
            const videoPromise = new Promise<void>((resolve) => {
                try {
                    if (fs.existsSync(videoPath)) {
                        fs.rmSync(videoPath);
                    }

                    const cp: ChildProcess = spawn(command!, args, {
                        stdio: 'ignore',
                        shell: true,
                        windowsHide: true
                    });

                    cp.on('close', () => {
                        try {
                            logger.info(
                                `Generated video for ${this.baseName} complete: "${videoPath}" (${Date.now() - start}ms)`
                            );
                            if (fs.existsSync(this.recordingPath)) {
                                fs.rmSync(this.recordingPath, { recursive: true });
                            }
                            return resolve();
                        } catch (error) {
                            logger.error(`Error closing generating video for ${this.baseName}: ${error}`);
                            return resolve();
                        }
                    });
                } catch (error) {
                    logger.error(`Error generating video for ${this.baseName}: ${error}`);
                    return resolve();
                }
            });
            return videoPromise;
        } catch (error) {
            logger.error(`Error generating video for ${this.baseName}: ${error}`);
            return null;
        }
    }

    async addFrame(): Promise<void> {
        const frame = this.frameCount++;
        const step = this.currentStepValue;

        const filePath = path.resolve(this.recordingPath, frame.toString().padStart(6, '0') + '.png');

        try {
            if (!this.driver) {
                logger.error('Video Recorder: Driver is not set');
                return;
            }

            if (!this.recordingPath) {
                logger.error('Video Recorder: Recording path is not set');
                return;
            }

            //console.log(`Screenshot (frame: ${frame}) to ${filePath} started`);
            await this.driver.saveScreenshot(filePath);
            await this.addStepToFrame(filePath, step, frame);
            //console.log(`Screenshot (frame: ${frame}) to ${filePath} completed`);
        } catch (error) {
            logger.info(`Screenshot not available (frame: ${frame}). Error: ${error}..`);
        }
    }

    private async addStepToFrame(filePath: string, step: number | string, frame: number): Promise<void> {
        const sText = `STEP ${step.toString()}`;

        try {
            // Using any type for Jimp as the API has changed significantly between versions
            const JimpClass = Jimp as any;
            const bkgrColor = JimpClass.cssColorToHex('rgba(18, 18, 18, 0.5)');
            const textWidth = sText.length < 9 ? 350 : 450;
            const txtImage = new JimpClass({ width: textWidth, height: 100, color: bkgrColor });
            const font = await JimpClass.loadFont(JimpClass.FONT_SANS_64_WHITE);
            txtImage.print({ font: font, x: 10, y: 10, text: sText });

            const image = await JimpClass.read(filePath);
            let imageWidth = image.bitmap.width;
            let imageHeight = image.bitmap.height;

            if (imageWidth % 2 !== 0 || imageHeight % 2 !== 0) {
                if (imageWidth % 2 !== 0) {
                    imageWidth++;
                }
                if (imageHeight % 2 !== 0) {
                    imageHeight++;
                }
                await image.resize({ w: imageWidth, h: imageHeight });
            }

            await image.blit(txtImage, 10, 10);
            await image.write(filePath);
        } catch (error) {
            logger.error(`Error adding step to frame ${frame}: ${error}`);
        }
    }
}
