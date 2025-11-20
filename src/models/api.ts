import { apiCall } from '../helpers/apicall';
import { TestRunnerError } from '../helpers/test-errors';
import { replaceVariables } from '../helpers/utils';
import { ApiConfiguration, OutputVariable } from '../types';

interface ApiCallResult {
    success: boolean;
    statusCode?: number;
    statusText?: string;
    headers?: any;
    responseBody?: any;
    schemaValidation: boolean;
    schemaValidationErrors: any[];
    outputs?: Record<string, any>;
    error?: string;
}

export class TrApi {
    private readonly id: string = '';
    private readonly method: string = '';
    private path: string = '';
    private readonly headers: Record<string, any> = {};
    private readonly body: any = null;
    private readonly schema: any = null;
    private readonly properties: string[] = [];
    private readonly outputs: OutputVariable[] = [];

    constructor(
        api: Partial<ApiConfiguration> & {
            id?: string;
            path?: string;
            properties?: string[];
            outputs?: OutputVariable[];
            body?: any;
        }
    ) {
        this.id = api.id || '';
        this.method = api.method || 'GET';
        this.path = api.path || api.url || '';
        this.headers = api.headers || {};
        this.body = api.body || api.data || null;
        this.schema = api.schema || null;
        this.properties = api.properties || [];
        this.outputs = api.outputs || [];
    }

    get getId(): string {
        return this.id;
    }

    get getMethod(): string {
        return this.method;
    }

    get getPath(): string {
        return this.path;
    }

    set setPath(value: string) {
        this.path = value;
    }

    get getHeaders(): Record<string, any> {
        return this.headers;
    }

    get getBody(): any {
        return this.body;
    }

    get getSchema(): any {
        return this.schema;
    }

    get getProperties(): string[] {
        return this.properties;
    }

    get getOutputs(): OutputVariable[] {
        return this.outputs;
    }

    duplicate(): TrApi {
        return new TrApi({
            id: this.id,
            method: this.method as any,
            path: this.path,
            headers: this.headers,
            body: this.body,
            schema: this.schema,
            properties: this.properties,
            outputs: this.outputs,
            url: this.path,
            name: this.id
        });
    }

    async run(propertiesValues: any[], isApiTesting: boolean = false): Promise<ApiCallResult> {
        const propertiesMap: Record<string, any> = {};
        if (!propertiesValues || propertiesValues.length !== this.properties.length) {
            throw new TestRunnerError(
                `API::Invalid properties values length: expected ${this.properties.length}, got ${propertiesValues ? propertiesValues.length : 0}`
            );
        }
        for (let i = 0; i < this.properties.length; i++) {
            const prop = this.properties[i];
            propertiesMap[prop] = propertiesValues[i];
        }

        const url = replaceVariables(this.path, propertiesMap);

        let apiHeaders = '';
        if (this.headers) {
            apiHeaders = JSON.stringify(this.headers).replace(/\s+/g, ' ').trim();
            apiHeaders = replaceVariables(apiHeaders, propertiesMap);
        }
        let apiData = '';
        if (this.body) {
            apiData = JSON.stringify(this.body).replace(/\s+/g, ' ').trim();
            apiData = replaceVariables(apiData, propertiesMap);
        }

        const schema = isApiTesting ? this.schema : null;

        const result = await apiCall(this.outputs, url, this.method, apiHeaders, apiData, schema);

        console.log(
            `API call result for ${this.id} - ${this.method} ${url}:  ${result.success ? 'Success' : 'Failed'} (Status: ${result.statusCode}, outputs: ${JSON.stringify(result.outputs)})`
        );

        return result;
    }
}
