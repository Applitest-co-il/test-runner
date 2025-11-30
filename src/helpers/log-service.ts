/**
 * Log service with configurable output levels
 */

export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    INFO = 2,
    DEBUG = 3
}

export type LogType = 'INFO' | 'ERROR' | 'DEBUG';

class LogService {
    private static instance: LogService;
    private logLevel: LogLevel = LogLevel.INFO;

    private constructor() {}

    public static getInstance(): LogService {
        if (!LogService.instance) {
            LogService.instance = new LogService();
        }
        return LogService.instance;
    }

    /**
     * Set the global log level
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Get the current log level
     */
    public getLogLevel(): LogLevel {
        return this.logLevel;
    }

    /**
     * Log a message with the specified type
     */
    public log(type: LogType, message: string, ...args: unknown[]): void {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${type}]`;

        switch (type) {
            case 'ERROR':
                if (this.logLevel >= LogLevel.ERROR) {
                    console.error(prefix, message, ...args);
                }
                break;
            case 'INFO':
                if (this.logLevel >= LogLevel.INFO) {
                    console.log(prefix, message, ...args);
                }
                break;
            case 'DEBUG':
                if (this.logLevel >= LogLevel.DEBUG) {
                    console.debug(prefix, message, ...args);
                }
                break;
        }
    }

    /**
     * Convenience methods
     */
    public info(message: string, ...args: unknown[]): void {
        this.log('INFO', message, ...args);
    }

    public error(message: string, ...args: unknown[]): void {
        this.log('ERROR', message, ...args);
    }

    public debug(message: string, ...args: unknown[]): void {
        this.log('DEBUG', message, ...args);
    }
}

// Initialize log level from environment variables
const initializeLogLevel = () => {
    const logLevel = process.env.LOG_LEVEL?.toLowerCase();
    const loggerInstance = LogService.getInstance();

    switch (logLevel) {
        case 'debug':
            loggerInstance.setLogLevel(LogLevel.DEBUG);
            break;
        case 'info':
            loggerInstance.setLogLevel(LogLevel.INFO);
            break;
        case 'error':
            loggerInstance.setLogLevel(LogLevel.ERROR);
            break;
        case 'none':
            loggerInstance.setLogLevel(LogLevel.NONE);
            break;
        default: {
            // Default to INFO, or DEBUG if VERBOSE/DEBUG env vars are set
            const defaultLevel =
                process.env.DEBUG === 'true' || process.env.VERBOSE === 'true' ? LogLevel.DEBUG : LogLevel.INFO;
            loggerInstance.setLogLevel(defaultLevel);
        }
    }

    return loggerInstance;
};

// Export singleton instance with initialization
export const logger = initializeLogLevel();

// Export the class for testing purposes
export { LogService };
