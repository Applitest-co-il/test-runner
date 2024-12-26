const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const Jimp = require('jimp');
const JimpFonts = require('jimp/fonts');

class VideoRecorder {
    #outputDir = '';
    #baseName = 'video';

    #driver = null;

    #frameCount = 0;
    #currentStep = 0;

    #recordingPath = '';

    constructor(driver, options) {
        if (!driver) {
            throw new Error('VideoRecorder:Driver is required');
        }
        this.#driver = driver;

        if (options.outputDir) {
            this.#outputDir = options.outputDir;
        }
        if (options.baseName) {
            this.#baseName = options.baseName.trim().replace(/\s/g, '_');
        }
    }

    set currentStep(step) {
        this.#currentStep = step;
    }

    async start() {
        console.log('Starting video recording...');

        try {
            if (!fs.existsSync(this.#outputDir)) {
                fs.mkdirSync(this.#outputDir, { recursive: true });
            }
            this.#recordingPath = `${this.#outputDir}/${this.#baseName}`;
            if (fs.existsSync(this.#recordingPath)) {
                fs.rmSync(this.#recordingPath, { recursive: true });
            }
            fs.mkdirSync(this.#recordingPath, { recursive: true });
        } catch (err) {
            console.error(`Video Recorder: Error creating recording directory for ${this.#recordingPath}: ${err}`);
            this.#recordingPath = '';
            return;
        }

        this.#frameCount = 0;

        await this.addFrame();
    }

    async stop() {
        console.log('Stopping video recording...');
    }

    generateVideo() {
        console.log(`Generating video for ${this.#baseName}...`);

        try {
            const fileExtension = 'mp4';
            const vcodec = 'libx264';
            const videoPath = path.resolve(this.#outputDir, `${this.#baseName}.${fileExtension}`);

            let command = `${process.cwd()}/bin/ffmpeg`;
            if (process.env.NODE_ENV !== 'prod') {
                const ffmpeg = require('@ffmpeg-installer/ffmpeg');
                command = ffmpeg.path;
            }

            console.log(`FFmpeg Command: ${command}`);

            const args = [
                '-y',
                '-framerate 1',
                `-i "${this.#recordingPath}/%6d.png"`,
                `-c:v ${vcodec}`,
                '-pix_fmt yuv420p',
                '-r 25',
                `"${videoPath}"`
            ];
            console.log(`Video generation ffmpeg command: ${command} ${args.join(' ')}`);

            const start = Date.now();
            const videoPromise = new Promise((resolve) => {
                if (fs.existsSync(videoPath)) {
                    fs.rmSync(videoPath);
                }

                const cp = spawn(command, args, {
                    stdio: 'ignore',
                    shell: true,
                    windowsHide: true
                });
                cp.on('close', () => {
                    console.log(`Generated video complete: "${videoPath}" (${Date.now() - start}ms)`);
                    if (fs.existsSync(this.#recordingPath)) {
                        fs.rmSync(this.#recordingPath, { recursive: true });
                    }
                    return resolve();
                });
            });
            return videoPromise;
        } catch (error) {
            console.error(`Error generating video: ${error}`);
            return null;
        }
    }

    async addFrame() {
        const frame = this.#frameCount++;
        const step = this.#currentStep;

        const filePath = path.resolve(this.#recordingPath, frame.toString().padStart(6, '0') + '.png');

        try {
            if (!this.#driver) {
                console.error('Video Recorder: Driver is not set');
                return;
            }

            if (!this.#recordingPath) {
                console.error('Video Recorder: Recording path is not set');
                return;
            }

            console.log(`Screenshot (frame: ${frame}) to ${filePath}`);
            await this.#driver.saveScreenshot(filePath);
            await this.addStepToFrame(filePath, step, frame);
        } catch (error) {
            console.log(`Screenshot not available (frame: ${frame}). Error: ${error}..`);
        }
    }

    async addStepToFrame(filePath, step, frame) {
        const sText = `STEP ${step.toString()}`;

        try {
            const bkgrColor = Jimp.cssColorToHex('rgba(18, 18, 18, 0.5)');
            const txtImage = new Jimp.Jimp({ width: 500, height: 150, color: bkgrColor });
            const font = await Jimp.loadFont(JimpFonts.SANS_128_WHITE);
            txtImage.print({ font: font, x: 10, y: 10, text: sText });

            const image = await Jimp.Jimp.read(filePath);
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
            console.error(`Error adding step to frame ${frame}: ${error}`);
        }
    }
}

module.exports = VideoRecorder;
