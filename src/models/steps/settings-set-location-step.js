const BaseStep = require('./base-step');
const { replaceVariables } = require('../../helpers/utils');
const { TestRunnerError } = require('../../helpers/test-errors');

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

            if (this.conf.runType === 'web') {
                await driver.emulate('geolocation', {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    accuracy: 100
                });
            } else if (this.conf.platformName.toLowerCase() === 'android') {
                await driver.execute('mobile:setGeolocation', { latitude, longitude, altitude });
            } else {
                throw new TestRunnerError('SetGeoLocation::Setting geo location is not supported on iOS yet');
            }
        } catch (error) {
            throw new TestRunnerError(`SetGeoLocation::Failed to set geo location. Error: ${error.message}`);
        }
    }
}

module.exports = SetLocationStep;
