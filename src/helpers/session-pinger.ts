import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async';
import { RunSession } from '../types';
import { logger } from './log-service';

export class SessionPinger {
    private sessions: RunSession[] = [];
    private interval: number = 60000; // Default interval of 60 seconds
    private intervalId: SetIntervalAsyncTimer<[]> | null = null;
    private running: boolean = false;

    constructor(sessions: RunSession[], interval?: number) {
        this.sessions = sessions;
        if (interval) {
            this.interval = interval;
        }
    }

    async pingSessions(): Promise<void> {
        if (!this.running) {
            console.warn('PingSession::Not running, skipping ping');
            return;
        }

        for (const session of this.sessions) {
            if (session.driver) {
                try {
                    let pingData: any = null;
                    if (session.type === 'web') {
                        pingData = await session.driver.getTitle(); // Simple command to keep the session alive
                    } else {
                        pingData = await session.driver.getDeviceTime(); // Simple command to keep the session alive
                    }
                    if (pingData) {
                        logger.info(`PingSession::Success for session type ${session.type}`);
                    } else {
                        logger.error(`PingSession::No valid response for session type ${session.type}`);
                    }
                } catch (error) {
                    logger.error(`PingSession::Error for session type ${session.type}:`, error);
                }
            } else {
                console.warn(`PingSession::Session driver is not available for type ${session.type}`);
            }
        }
    }

    start(): void {
        if (this.sessions.length < 2) {
            console.warn('No need to ping sessions as there are less than 2 sessions');
            return;
        }

        this.intervalId = setIntervalAsync(async () => {
            await this.pingSessions();
        }, this.interval);

        this.running = true;
        logger.info(`Session pinger started with interval ${this.interval}ms`);
    }

    async stop(): Promise<void> {
        this.running = false;
        if (this.intervalId) {
            await clearIntervalAsync(this.intervalId);
            logger.info('Session pinger stopped');
        }
    }
}
