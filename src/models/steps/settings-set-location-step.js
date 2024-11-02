const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');
const { TestRunnerError } = require('../../helpers/test-errors');
const { checkAppIsInstalled } = require('../../helpers/mobile-utils');

class SetLocationStep extends BaseStep {
    constructor(sequence, step) {
        super(sequence, step);
    }

    async execute(driver, _) {
        try {
            const value = replaceVariables(this.value, this.variables);
            const locationParts = value.split('|||');
            if (locationParts.length < 2) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude and longitude are required to set geo location - ${this.value}`
                );
            }
            const latitude = locationParts[0];
            const longitude = locationParts[1];
            const altitude = locationParts.length == 3 ? locationParts[2] : 0;

            if (isNaN(latitude) || isNaN(longitude) || (altitude && isNaN(altitude))) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude, longitude and altitude should be numbers - ${this.value}`
                );
            }

            if (this.conf.platformName.toLowerCase() === 'android') {
                const isIoAppiumSettingAppInstalled = await checkAppIsInstalled(driver, 'io.appium.settings');
                if (!isIoAppiumSettingAppInstalled) {
                    console.log(
                        `SetGeoLocation::App "io.appium.settings" is not installed on the device - installing it now`
                    );
                    await driver.execute('mobile: install', './apps/settings_apk-debug.apk');
                    console.log(`SetGeoLocation::Installed app "io.appium.settings"`);
                }

                console.log(`SetGeoLocation::Allowing mock location for app "io.appium.settings"`);
                let command = 'appops set io.appium.settings android:mock_location allow';
                await driver.execute('mobile: shell', { command: command });

                console.log(
                    `SetGeoLocation::Starting location service for app "io.appium.settings" with latitude: ${latitude}, longitude: ${longitude}m altitude: ${altitude}`
                );
                command = `am start-foreground-service --user 0 -n io.appium.settings/.LocationService --es longitude ${longitude} --es latitude ${latitude} ${altitude != 0 ? '--es altitude ' + altitude : ''}`;
                await driver.execute('mobile: shell', { command: command });

                console.log(
                    `SetGeoLocation::Set geo location to latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}`
                );
            } else {
                throw new TestRunnerError('SetGeoLocation::Setting geo location is not supported on iOS yet');
            }
        } catch (error) {
            throw new TestRunnerError(`SetGeoLocation::Failed to set geo location. Error: ${error.message}`);
        }
    }
}

module.exports = SetLocationStep;
