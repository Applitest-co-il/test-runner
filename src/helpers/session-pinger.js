const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');

class SessionPinger {
    #sessions = [];
    #interval = 60000; // Default interval of 60 seconds
    #intervalId = null;
    #running = false;

    constructor(sessions, interval) {
        this.#sessions = sessions;
        if (interval) {
            this.#interval = interval;
        }
    }

    async pingSessions() {
        if (!this.#running) {
            console.warn('PingSession::Not running, skipping ping');
            return;
        }

        for (const session of this.#sessions) {
            if (session.driver) {
                try {
                    if (session.type === 'web') {
                        await session.driver.getTitle(); // Simple command to keep the session alive
                    } else {
                        await session.driver.getDeviceTime(); // Simple command to keep the session alive
                    }
                    console.log(`PingSession::Success for session type ${session.type}`);
                } catch (error) {
                    console.error(`PingSession::Error for session type ${session.type}:`, error);
                }
            } else {
                console.warn(`PingSession::Session driver is not available for type ${session.type}`);
            }
        }
    }

    start() {
        if (this.#sessions.length < 2) {
            console.warn('No need to ping sessions as there are less than 2 sessions');
            return;
        }

        const that = this;
        this.#intervalId = setIntervalAsync(async () => {
            await that.pingSessions();
        }, this.#interval);

        this.#running = true;
        console.log(`Session pinger started with interval ${this.#interval}ms`);
    }

    async stop() {
        this.#running = false;
        if (this.#intervalId) {
            await clearIntervalAsync(this.#intervalId);
            console.log('Session pinger stopped');
        }
    }
}

module.exports = SessionPinger;
