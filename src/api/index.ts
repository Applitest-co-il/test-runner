#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true });

// Ensure output is flushed immediately
if (process.stdout.isTTY) {
    process.stdout.setEncoding('utf8');
}
if (process.stderr.isTTY) {
    process.stderr.setEncoding('utf8');
}

import { createLocalTestRunner } from '../lib/server';
import { logger, LogLevel } from '../helpers/log-service';

// Initialize log level based on environment variables
const logLevel = process.env.LOG_LEVEL?.toLowerCase();
switch (logLevel) {
    case 'debug':
        logger.setLogLevel(LogLevel.DEBUG);
        break;
    case 'info':
        logger.setLogLevel(LogLevel.INFO);
        break;
    case 'error':
        logger.setLogLevel(LogLevel.ERROR);
        break;
    case 'none':
        logger.setLogLevel(LogLevel.NONE);
        break;
    default:
        // Default to INFO if not specified or invalid
        logger.setLogLevel(
            process.env.DEBUG === 'true' || process.env.VERBOSE === 'true' ? LogLevel.DEBUG : LogLevel.INFO
        );
}

const PORT = process.env.TR_PORT ? parseInt(process.env.TR_PORT, 10) : 8282;

logger.info('🚀 Starting TestRunner API server...');
logger.info(`📍 Port: ${PORT}`);
logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
logger.debug(`📂 Working directory: ${process.cwd()}`);
logger.debug(`🔧 Node version: ${process.version}`);
logger.debug(`💾 Platform: ${process.platform}`);

const server = createLocalTestRunner(PORT);

// Add error handling with logger
server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`❌ ERROR: Port ${PORT} is already in use`);
        logger.error(`Please stop the existing server or use a different port`);
        process.exit(1);
    } else {
        logger.error(`❌ Server error: ${error.message}`);
        process.exit(1);
    }
});

// Ensure we show startup completion
server.on('listening', () => {
    logger.info(`✅ TestRunner API server successfully started on port ${PORT}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`📊 Version info: http://localhost:${PORT}/version`);
    logger.info(`Server is ready to accept connections...`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`❌ Uncaught Exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});
