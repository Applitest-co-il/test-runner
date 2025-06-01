const axios = require('axios');

async function apiCall(outputs, url, method = 'GET', headers = {}, data = null) {
    try {
        const axiosOptions = {
            url: url,
            method: method,
            headers: headers
        };
        if (data && Object.keys(data).length > 0) {
            axiosOptions.data = data;
        }
        const response = await axios(axiosOptions);

        const extractedOutputs = {};
        if (outputs && outputs.length > 0) {
            outputs.forEach((output) => {
                extractedOutputs[output] = response.data[output];
            });
        }

        const result = {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            responseBody: response.data,
            outputs: extractedOutputs
        };

        return result;
    } catch (error) {
        console.error(`API call error: ${error.message}`);
        throw new Error(`API call failed: ${error.message}`);
    }
}

module.exports = { apiCall };
