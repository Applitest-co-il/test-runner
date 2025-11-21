import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { downloadFile } from '../helpers/download-file';
import { runTests, testApiCall, openSession, closeSession, runSession, libVersion } from './index';
import { TestRunnerOptions } from '../types';
import { Server } from 'http';

// Helpers
async function preProcessOptions(options: TestRunnerOptions): Promise<boolean> {
    if (!options || !options.runConfiguration) {
        return false;
    }

    // Additional checks can be added here
    const sessionTypes = options.runConfiguration.sessions.map((s) => s.type);
    const runType = sessionTypes.includes('mixed') ? 'mixed' : sessionTypes.includes('mobile') ? 'mobile' : 'web';

    if (['mobile', 'mixed'].includes(runType)) {
        console.log('Received mobile run configuration');
        const session = options.runConfiguration.sessions.find((session: any) => session.type === 'mobile');
        if (session?.appium?.app?.startsWith('s3:')) {
            const appName = session.appium.appName;
            const url = session.appium.app.replace('s3:', '');

            const appLocalPath = await downloadFile(url, appName);
            if (!appLocalPath) {
                console.error('App download failed');
                return false;
            }

            console.log(`App downloaded to: ${appLocalPath}`);
            session.appium.app = appLocalPath;
        }
    }

    options.runConfiguration.videosPath = process.env.VIDEOS_PATH;

    return true;
}

export function createLocalTestRunner(port: number): Server {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '500KB' }));

    // Logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Store original res.json method
        const originalJson = res.json;

        // Override res.json to log response
        res.json = function (data: any) {
            const duration = Date.now() - startTime;
            const statusText = res.statusMessage || 'OK';

            let logMessage = `${req.method} ${req.url} → ${res.statusCode} ${statusText} ${duration}ms`;

            // Add error message if response indicates an error
            if (res.statusCode >= 400 && data && data.message) {
                logMessage += ` - ${data.message}`;
            }

            console.log(logMessage);

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    });

    // Utilities
    app.get('/version', (_: Request, res: Response) => {
        res.status(200).json({ version: libVersion.version });
    });

    // Health check
    app.get('/health', (_: Request, res: Response) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: libVersion.version
        });
    });

    //#region full run
    app.post('/run', async (req: Request, res: Response) => {
        try {
            const options: TestRunnerOptions = req.body;

            const preprocessed = await preProcessOptions(options);
            if (!preprocessed) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to preprocess options'
                });
            }

            const result = await runTests(options);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error running tests:', error);
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    });

    //#endregion

    //#region API call testing

    app.patch('/api', async (req: Request, res: Response) => {
        try {
            const { method, path, headers, data, schema, variables, outputs } = req.body;

            const result = await testApiCall(method, path, headers, data, schema, variables || {}, outputs || []);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error testing API call:', error);
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    });

    //#endregion

    //#region Session run

    app.post('/session', async (req: Request, res: Response) => {
        try {
            const options: TestRunnerOptions = req.body;

            const preprocessed = await preProcessOptions(options);
            if (!preprocessed) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to preprocess options'
                });
            }

            const result = await openSession(options);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error opening session:', error);
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    });

    app.patch('/session/:sessionId', async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const options = req.body.options;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
            }

            const result = await runSession(sessionId, options);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error running session:', error);
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    });

    app.delete('/session/:sessionId', async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
            }

            const result = await closeSession(sessionId);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error closing session:', error);
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    });

    //#endregion

    // Error handling middleware
    app.use((error: Error, req: Request, res: Response, _: NextFunction) => {
        console.error('Unhandled error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });

    // 404 handler
    app.use((_: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    });

    const server = app.listen(port, () => {
        console.log(`TestRunner API server is running on port ${port}`);
        console.log(`Version: ${libVersion.version}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    return server;
}
