async function checkAppIsInstalled(driver, app) {
    const isInstallCommand = `pm list packages ${app}`;
    const packages = await driver.execute('mobile: shell', { command: isInstallCommand });
    const isInstalled = packages.includes(app);
    return isInstalled;
}

module.exports = { checkAppIsInstalled };
