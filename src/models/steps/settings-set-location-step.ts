import BaseStep from './base-step';
import { replaceVariables } from '../../helpers/utils';
import { TestRunnerError } from '../../helpers/test-errors';
import { TestStep } from '../../types';
import { Browser } from 'webdriverio';

class SetLocationStep extends BaseStep {
    constructor(sequence: number, step: TestStep) {
        super(sequence, step);
    }

    async execute(driver: Browser, _?: any): Promise<void> {
        try {
            const value = replaceVariables(this.value || '', this.variables || {});
            const locationParts = value.split('|||');
            if (locationParts.length < 2) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude and longitude are required to set geo location - ${this.value}`
                );
            }
            const latitude = locationParts[0];
            const longitude = locationParts[1];
            const altitude = locationParts.length === 3 ? locationParts[2] : '0';

            if (isNaN(Number(latitude)) || isNaN(Number(longitude)) || (altitude && isNaN(Number(altitude)))) {
                throw new TestRunnerError(
                    `SetGeoLocation::Latitude, longitude and altitude should be numbers - ${this.value}`
                );
            }

            const conf = this.conf;
            if (conf?.runType === 'web') {
                await driver.emulate('geolocation', {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    accuracy: 100
                });
            } else if (conf?.platformName.toLowerCase() === 'android') {
                await driver.execute('mobile:setGeolocation', { latitude, longitude, altitude });
            } else {
                throw new TestRunnerError('SetGeoLocation::Setting geo location is not supported on iOS yet');
            }
        } catch (error: any) {
            throw new TestRunnerError(`SetGeoLocation::Failed to set geo location. Error: ${error.message}`);
        }
    }
}

export = SetLocationStep;
