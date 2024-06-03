const axios = require('axios');
const tokenClient = require('./token');

async function getRunConfigurationFromApplitestManager(organization, id) {
    let retry = false;
    let count = 0;
    do {
        count++;
        let token = await tokenClient.getIntraComToken(retry);
        if (!token) {
            continue;
        }

        const domain = process.env.PUBLIC_API_BASE_URL;
        let options = {
            method: 'GET',
            url: `${domain}/v1/organizations/${organization}/run-configuration/${id}`,
            headers: {
                'x-api-jwt': token
            }
        };
        const response = await axios
            .request(options)
            .then(function (response) {
                return response.data;
            })
            .catch(function (error) {
                if (error.response && error.response.status === 401) {
                    retry = true;
                    return null;
                }
                console.error(`Error: ${error}`);
                return null;
            });
        if (response) {
            const output = {
                runConfiguration: response.runConfiguration,
                issues: response
            };
            return output;
        }
    } while (retry && count < 3);

    return null;
}

module.exports = { getRunConfigurationFromApplitestManager };
