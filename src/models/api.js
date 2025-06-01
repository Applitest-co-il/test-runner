const { apiCall } = require('../helpers/apicall.js');
const { TestRunnerError } = require('../helpers/test-errors.js');
const { replaceVariables } = require('../helpers/utils.js');

class TrApi {
    #id = '';
    #method = '';
    #path = '';
    #headers = {};
    #body = null;
    #properties = [];
    #outputs = [];

    constructor(api) {
        this.#id = api.id || '';
        this.#method = api.method || 'GET';
        this.#path = api.path || '';
        this.#headers = api.headers || {};
        this.#body = api.body || null;
        this.#properties = api.properties || [];
        this.#outputs = api.outputs || [];
    }

    get id() {
        return this.#id;
    }

    get path() {
        return this.#path;
    }

    set path(value) {
        this.#path = value;
    }

    async run(propertiesValues) {
        const propertiesMap = {};
        if (!propertiesValues || propertiesValues.length !== this.#properties.length) {
            throw new TestRunnerError(
                `API::Invalid properties values length: expected ${this.#properties.length}, got ${propertiesValues ? propertiesValues.length : 0}`
            );
        }
        for (let i = 0; i < this.#properties.length; i++) {
            const prop = this.#properties[i];
            propertiesMap[prop] = propertiesValues[i];
        }

        const url = replaceVariables(this.#path, propertiesMap);

        const apiHeaders = {};
        if (this.#headers) {
            Object.keys(this.#headers).forEach((key) => {
                apiHeaders[key] = replaceVariables(this.#headers[key], propertiesMap);
            });
        }
        const apiData = {};
        if (this.#body) {
            Object.keys(this.#body).forEach((key) => {
                apiData[key] = replaceVariables(this.#body[key], propertiesMap);
            });
        }

        const result = await apiCall(this.#outputs, url, this.#method, apiHeaders, apiData);
        return {
            success: true,
            outputs: result.outputs
        };
    }
}

module.exports = TrApi;
