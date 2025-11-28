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

const PORT = process.env.TR_PORT ? parseInt(process.env.TR_PORT, 10) : 8282;

// Force output to be visible
const isVerbose = process.env.VERBOSE === 'true' || process.env.DEBUG === 'true';

process.stdout.write('🚀 Starting TestRunner API server...\n');
process.stdout.write(`📍 Port: ${PORT}\n`);
process.stdout.write(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

if (isVerbose) {
    process.stdout.write(`📂 Working directory: ${process.cwd()}\n`);
    process.stdout.write(`🔧 Node version: ${process.version}\n`);
    process.stdout.write(`💾 Platform: ${process.platform}\n`);
}

const server = createLocalTestRunner(PORT);

// Add error handling with forced output
server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        process.stderr.write(`❌ ERROR: Port ${PORT} is already in use\n`);
        process.stderr.write(`Please stop the existing server or use a different port\n`);
        process.exit(1);
    } else {
        process.stderr.write(`❌ Server error: ${error.message}\n`);
        process.exit(1);
    }
});

// Ensure we show startup completion
server.on('listening', () => {
    process.stdout.write(`✅ TestRunner API server successfully started on port ${PORT}\n`);
    process.stdout.write(`🔗 Health check: http://localhost:${PORT}/health\n`);
    process.stdout.write(`📊 Version info: http://localhost:${PORT}/version\n`);
    process.stdout.write(`\nServer is ready to accept connections...\n`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    process.stderr.write(`❌ Uncaught Exception: ${error.message}\n`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    process.stderr.write(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}\n`);
    process.exit(1);
});
