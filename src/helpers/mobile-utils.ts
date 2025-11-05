import { ExtendedBrowser } from '../types';

export async function checkAppIsInstalled(driver: ExtendedBrowser, app: string): Promise<boolean> {
    const isInstallCommand = `pm list packages ${app}`;
    const packages = await driver.execute('mobile: shell', { command: isInstallCommand });
    const isInstalled = (packages as string).includes(app);
    return isInstalled;
}
