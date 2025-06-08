const axios = require('axios');
const Ajv = require('ajv');

async function apiCall(outputs, url, method = 'GET', headers = '', data = '', schema = null) {
    try {
        const axiosOptions = {
            url: url,
            method: method
        };
        if (headers && headers.length > 0) {
            axiosOptions.headers = JSON.parse(headers);
        }
        if (data && data.length > 0) {
            axiosOptions.data = JSON.parse(data);
        }
        const response = await axios(axiosOptions);

        const extractedOutputs = {};
        if (outputs && outputs.length > 0) {
            outputs.forEach((output) => {
                extractedOutputs[output] = response.data[output];
            });
        }

        let schemaValidation = false;
        let schemaValidationErrors = [];
        if (schema) {
            try {
                schema.additionalProperties = false;
                const ajv = new Ajv({ strict: 'log', strictSchema: false, allErrors: true });
                const validate = ajv.compile(schema);
                schemaValidation = validate(response.data);
                if (!schemaValidation) {
                    schemaValidationErrors = validate.errors;
                }
            } catch (error) {
                console.error('Schema validation error:', error);
                schemaValidationErrors = [error.message];
            }
        }

        const result = {
            success: true,
            statusCode: response.status,
            statusText: response.statusText,
            headers: response.headers,
            responseBody: response.data,
            schemaValidation: schemaValidation,
            schemaValidationErrors: schemaValidationErrors,
            outputs: extractedOutputs
        };

        return result;
    } catch (error) {
        console.error(`API call error: ${error.message}`);
        return {
            success: false,
            error: error.message,
            statusCode: error.response ? error.response.status : null,
            statusText: error.response ? error.response.statusText : null,
            headers: error.response ? error.response.headers : {},
            responseBody: error.response ? error.response.data : null,
            schemaValidation: false,
            schemaValidationErrors: []
        };
    }
}

module.exports = { apiCall };
