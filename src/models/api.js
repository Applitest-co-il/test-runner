const { apiCall } = require('../helpers/apicall.js');
const { TestRunnerError } = require('../helpers/test-errors.js');
const { replaceVariables } = require('../helpers/utils.js');

class TrApi {
    #id = '';
    #method = '';
    #path = '';
    #headers = {};
    #body = null;
    #schema = null;
    #properties = [];
    #outputs = [];

    constructor(api) {
        this.#id = api.id || '';
        this.#method = api.method || 'GET';
        this.#path = api.path || '';
        this.#headers = api.headers || {};
        this.#body = api.body || null;
        this.#schema = api.schema || null;
        this.#properties = api.properties || [];
        this.#outputs = api.outputs || [];
    }

    get id() {
        return this.#id;
    }

    get method() {
        return this.#method;
    }

    get path() {
        return this.#path;
    }

    set path(value) {
        this.#path = value;
    }

    get headers() {
        return this.#headers;
    }

    get body() {
        return this.#body;
    }

    get schema() {
        return this.#schema;
    }

    get properties() {
        return this.#properties;
    }

    get outputs() {
        return this.#outputs;
    }

    duplicate() {
        return new TrApi({
            id: this.#id,
            method: this.#method,
            path: this.#path,
            headers: this.#headers,
            body: this.#body,
            schema: this.#schema,
            properties: this.#properties,
            outputs: this.#outputs
        });
    }

    async run(propertiesValues, isApiTesting = false) {
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

        const schema = isApiTesting ? this.#schema : null;

        const result = await apiCall(this.#outputs, url, this.#method, apiHeaders, apiData, schema);
        return result;
    }
}

module.exports = TrApi;
