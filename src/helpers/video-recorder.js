const os = require('os');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const Jimp = require('jimp');
const JimpFonts = require('jimp/fonts');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');

class VideoRecorder {
    #outputDir = os.tmpdir();
    #baseName = 'video';
    #screenShotIntervalinMilliseconds = 0;

    #driver = null;

    #frameCount = 0;
    #currentStep = 0;

    #recordingPath = '';
    #intervalScreenshot = null;
    #screenShotPromises = [];
    #notAvailablePng = null;

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
        if (options.screenShotInterval) {
            this.#screenShotIntervalinMilliseconds = options.screenShotInterval;
        }
    }

    set currentStep(step) {
        this.#currentStep = step;
    }

    async start() {
        console.log('Starting video recording...');

        try {
            this.#recordingPath = `${this.#outputDir}/${this.#baseName}`;
            if (fs.existsSync(this.#recordingPath)) {
                fs.rmSync(this.#recordingPath, { recursive: true });
            }
            fs.mkdirSync(this.#recordingPath, { recursive: true });

            const notAvailablePngPath = path.resolve(__dirname, '../assets/not-available.png');
            this.#notAvailablePng = fs.readFileSync(notAvailablePngPath, 'base64');
        } catch (err) {
            console.error(`Video Recorder: Error creating recording directory for ${this.#recordingPath}: ${err}`);
            this.#recordingPath = '';
            return;
        }

        this.#frameCount = 0;
        if (this.#screenShotIntervalinMilliseconds) {
            const instance = this;
            this.#intervalScreenshot = setInterval(() => instance.addFrame(), this.#screenShotIntervalinMilliseconds);
        }
    }

    async stop() {
        console.log('Stopping video recording...');

        if (this.#intervalScreenshot) {
            clearInterval(this.#intervalScreenshot);
        }

        await Promise.all(this.#screenShotPromises);
    }

    async generateVideo() {
        console.log(`Generating video: ${ffmpeg.path}  ${ffmpeg.version}`);

        try {
            const fileExtension = 'mp4';
            const vcodec = 'libx264';
            const videoPath = path.resolve(this.#outputDir, `${this.#baseName}.${fileExtension}`);

            const command = `${ffmpeg.path}`;
            const args = [
                '-y',
                '-r 10',
                `-i "${this.#recordingPath}/%06d.png"`,
                `-vcodec ${vcodec}`,
                '-crf 32',
                '-pix_fmt yuv420p',
                '-vf "setpts=3.0*PTS"',
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
                    console.log(`Generated video: "${videoPath}" (${Date.now() - start}ms)`);
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
        const notAvailablePng = this.#notAvailablePng;

        try {
            if (!this.#driver) {
                console.error('Video Recorder: Driver is not set');
                return;
            }

            if (!this.#recordingPath) {
                console.error('Video Recorder: Recording path is not set');
                return;
            }

            this.#screenShotPromises.push(
                this.#driver
                    .saveScreenshot(filePath)
                    .then(async () => {
                        console.log(`Screenshot (frame: ${frame}) to ${filePath}`);
                        await this.addStepToFrame(filePath, step, frame);
                    })
                    .catch((error) => {
                        fs.writeFileSync(filePath, notAvailablePng, 'base64');
                        console.log(`Screenshot not available (frame: ${frame}). Error: ${error}..`);
                    })
            );
        } catch (error) {
            fs.writeFileSync(filePath, notAvailablePng, 'base64');
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
