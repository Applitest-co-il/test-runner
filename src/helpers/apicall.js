const axios = require('axios');
const Ajv = require('ajv');
const jmesPath = require('jmespath');

async function apiCall(outputs, url, method = 'GET', headers = '', data = '', schema = null) {
    try {
        const axiosOptions = {
            url: url,
            method: method
        };
        if (headers && headers.length > 2) {
            axiosOptions.headers = JSON.parse(headers);
        }
        if (data && data.length > 2) {
            axiosOptions.data = JSON.parse(data);
        }
        const response = await axios(axiosOptions);

        const extractedOutputs = {};
        if (outputs && outputs.length > 0 && response.data) {
            outputs.forEach((output) => {
                const outputParts = output.split('|');
                const outputKey = outputParts[0];
                const outputQuery = outputParts.length > 1 ? outputParts[1] : outputKey;
                const extractedValue = jmesPath.search(response.data, outputQuery);
                if (extractedValue) {
                    if (Array.isArray(extractedValue) && extractedValue.length > 0) {
                        extractedOutputs[outputKey] = extractedValue[0];
                    } else {
                        extractedOutputs[outputKey] = extractedValue;
                    }
                }
            });
        }

        let schemaValidation = false;
        let schemaValidationErrors = [];
        if (schema && Object.keys(schema).length > 0) {
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
