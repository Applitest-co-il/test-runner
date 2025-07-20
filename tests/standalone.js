// test-commonjs.js - WebdriverIO Standalone CommonJS Version

const { remote } = require('webdriverio');

async function runTest() {
    let browser;

    try {
        // Browser configuration
        const options = {
            protocol: 'http',
            hostname: 'localhost',
            port: 4444,
            path: '/wd/hub',
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1920,1080']
                }
            },
            logLevel: 'info',
            connectionRetryTimeout: 120000,
            connectionRetryCount: 3,
            waitforTimeout: 10000
        };

        console.log('Starting browser session...');
        browser = await remote(options);

        // Navigate and interact
        await browser.url('https://www.google.com');
        console.log('Page title:', await browser.getTitle());

        // Search functionality
        const searchBox = await browser.$('input[name="q"]');
        await searchBox.setValue('WebdriverIO Docker');
        await browser.keys('Enter');

        // Wait for results
        await browser.waitUntil(async () => (await browser.$$('h3')).length > 0, {
            timeout: 10000,
            timeoutMsg: 'Search results not loaded'
        });

        const results = await browser.$$('h3');
        console.log(`Found ${results.length} results`);

        // Take screenshot
        await browser.saveScreenshot('./test-result.png');
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
        if (browser) {
            await browser.saveScreenshot('./error.png');
        }
    } finally {
        if (browser) {
            await browser.deleteSession();
        }
    }
}

// Function to check if Selenium Grid is available
async function checkSeleniumStatus() {
    try {
        const http = require('http');

        return new Promise((resolve) => {
            const req = http.get('http://localhost:4444/wd/hub/status', (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const status = JSON.parse(data);
                        resolve(status.value.ready);
                    } catch (e) {
                        resolve(false);
                    }
                });
            });

            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
        });
    } catch (error) {
        console.error('Error checking Selenium status:', error);
        return false;
    }
}

// Main execution
async function main() {
    console.log('Checking Selenium Grid...');

    const isSeleniumReady = await checkSeleniumStatus();
    if (!isSeleniumReady) {
        console.log('Selenium Grid is not ready. Start it with:');
        console.log('docker run -d -p 4444:4444 -p 7900:7900 --shm-size=2g selenium/standalone-chrome:latest');
        return;
    }

    console.log('Selenium Grid is ready, starting test...');
    await runTest();
}

main().catch(console.error);
