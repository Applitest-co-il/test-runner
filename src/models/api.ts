import { apiCall } from '../helpers/apicall';
import { TestRunnerError } from '../helpers/test-errors';
import { replaceVariables } from '../helpers/utils';
import { logger } from '../helpers/log-service';
import { ApiConfiguration, OutputVariable } from '../types';

interface ApiCallResult {
    success: boolean;
    statusCode?: number;
    statusText?: string;
    headers?: any;
    responseBody?: any;
    schemaValidation: boolean;
    schemaValidationErrors: any[];
    outputs?: Record<string, string>;
    error?: string;
}

export class TrApi {
    private readonly _id: string = '';
    private readonly _name: string = '';
    private readonly _method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET';
    private _path: string = '';
    private readonly _headers: Record<string, string> = {};
    private readonly _body: any = null;
    private readonly _schema: any = null;
    private readonly _properties: string[] = [];
    private readonly _outputs: OutputVariable[] = [];

    constructor(api: ApiConfiguration) {
        this._id = api.id || '';
        this._name = api.name || '';
        this._method = api.method || 'GET';
        this._path = api.path || '';
        this._headers = api.headers || {};
        this._body = api.body || null;
        this._schema = api.schema || null;
        this._properties = api.properties || [];
        this._outputs = api.outputs || [];
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get method(): string {
        return this._method;
    }

    get path(): string {
        return this._path;
    }

    set path(value: string) {
        this._path = value;
    }

    get headers(): Record<string, string> {
        return this._headers;
    }

    get body(): any {
        return this._body;
    }

    get schema(): any {
        return this._schema;
    }

    get properties(): string[] {
        return this._properties;
    }

    get outputs(): OutputVariable[] {
        return this._outputs;
    }

    duplicate(): TrApi {
        return new TrApi({
            id: this._id,
            name: this._name,
            method: this._method,
            path: this._path,
            headers: this._headers,
            body: this._body,
            schema: this._schema,
            properties: this._properties,
            outputs: this._outputs
        });
    }

    async run(propertiesValues: any[], isApiTesting: boolean = false): Promise<ApiCallResult> {
        const propertiesMap: Record<string, any> = {};
        if (!propertiesValues || propertiesValues.length !== this._properties.length) {
            throw new TestRunnerError(
                `API::Invalid properties values length: expected ${this._properties.length}, got ${propertiesValues ? propertiesValues.length : 0}`
            );
        }
        for (let i = 0; i < this._properties.length; i++) {
            const prop = this._properties[i];
            propertiesMap[prop] = propertiesValues[i];
        }

        const url = replaceVariables(this._path, propertiesMap);

        let apiHeaders = '';
        if (this._headers) {
            apiHeaders = JSON.stringify(this._headers).replace(/\s+/g, ' ').trim();
            apiHeaders = replaceVariables(apiHeaders, propertiesMap);
        }
        let apiData = '';
        if (this._body) {
            apiData = JSON.stringify(this._body).replace(/\s+/g, ' ').trim();
            apiData = replaceVariables(apiData, propertiesMap);
        }

        const schema = isApiTesting ? this._schema : null;

        const result = await apiCall(this._outputs, url, this._method, apiHeaders, apiData, schema);

        logger.info(
            `API call result for ${this._id} - ${this._method} ${url}:  ${result.success ? 'Success' : 'Failed'} (Status: ${result.statusCode}, outputs: ${JSON.stringify(result.outputs)})`
        );

        return result;
    }
}
