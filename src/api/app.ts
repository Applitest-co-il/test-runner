import * as dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true });

import express, { Request, Response } from 'express';
import cors from 'cors';

import { downloadFile } from '../helpers/download-file';
import {
    runTests,
    testApiCall,
    openSession,
    closeSession,
    runSession,
    libVersion,
    getAxTree,
    getDomTree,
    doStep
} from '../lib/index';
import { TestRunConfiguration, OutputVariable } from '../types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '500KB' }));

// Utilities
app.get('/version', (_: Request, res: Response) => {
    res.status(200).json({ version: libVersion.version });
});

// Helpers
async function preProcessOptions(options: any): Promise<boolean> {
    if (!options) {
        return false;
    }

    // Additional checks can be added here
    if (['mobile', 'mixed'].includes(options?.runConfiguration?.runType)) {
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

    return true;
}

// API Routes

// Run tests
app.post('/run-tests', async (req: Request, res: Response) => {
    try {
        const options: any = req.body;

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

// Test API call
app.post('/test-api-call', async (req: Request, res: Response) => {
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

// Session management
app.post('/open-session', async (req: Request, res: Response) => {
    try {
        const options: TestRunConfiguration = req.body;

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

app.post('/run-session', async (req: Request, res: Response) => {
    try {
        const { sessionId, options } = req.body;

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

app.post('/close-session', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

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

// Accessibility tree endpoints
app.post('/get-ax-tree', async (req: Request, res: Response) => {
    try {
        const { sessionId, selector } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const result = await getAxTree(sessionId, selector);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting accessibility tree:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
});

app.post('/get-dom-tree', async (req: Request, res: Response) => {
    try {
        const { sessionId, selector } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const result = await getDomTree(sessionId, selector);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting DOM tree:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
});

// Do step endpoint
app.post('/do-step', async (req: Request, res: Response) => {
    try {
        const { sessionId, selector, stepCommand, stepValue } = req.body;

        if (!sessionId || !selector || !stepCommand) {
            return res.status(400).json({
                success: false,
                message: 'Session ID, selector, and step command are required'
            });
        }

        const result = await doStep(sessionId, selector, stepCommand, stepValue || '');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error executing step:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
});

// Health check
app.get('/health', (_: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: libVersion.version
    });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
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

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`TestRunner API server is running on port ${PORT}`);
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

export default app;
