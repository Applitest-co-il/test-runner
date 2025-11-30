import axios, { AxiosResponse, AxiosError } from 'axios';
import Ajv, { ValidateFunction } from 'ajv';
import * as jmesPath from 'jmespath';
import { logger } from './log-service';
import { OutputVariable, ApiCallResult, SchemaValidationError } from '../types';

export async function apiCall(
    outputs: OutputVariable[] | string[] = [],
    url: string,
    method: string = 'GET',
    headers: string = '',
    data: string = '',
    schema: any = null
): Promise<ApiCallResult> {
    try {
        const axiosOptions: any = {
            url: url,
            method: method
        };

        if (headers && headers.length > 2) {
            axiosOptions.headers = JSON.parse(headers);
        }

        if (data && data.length > 2) {
            axiosOptions.data = JSON.parse(data);
        }

        const response: AxiosResponse = await axios(axiosOptions);

        const extractedOutputs: Record<string, any> = {};
        if (outputs && outputs.length > 0 && response.data) {
            for (const output of outputs) {
                let outputKey: string;
                let outputQuery: string;

                if (typeof output === 'string') {
                    // Legacy string format: "key|query"
                    const outputParts = output.split('|');
                    outputKey = outputParts[0];
                    outputQuery = outputParts.length > 1 ? outputParts[1] : outputKey;
                } else {
                    // OutputVariable object format
                    outputKey = output.name;
                    outputQuery = output.value || output.name;
                }

                const extractedValue = jmesPath.search(response.data, outputQuery);
                if (extractedValue !== null && extractedValue !== undefined) {
                    if (Array.isArray(extractedValue) && extractedValue.length > 0) {
                        extractedOutputs[outputKey] = extractedValue[0];
                    } else {
                        extractedOutputs[outputKey] = extractedValue;
                    }
                }
            }
        }

        let schemaValidation = false;
        let schemaValidationErrors: SchemaValidationError[] = [];
        if (schema && Object.keys(schema).length > 0) {
            try {
                schema.additionalProperties = false;
                const ajv = new Ajv({ strict: false, allErrors: true });
                const validate: ValidateFunction = ajv.compile(schema);
                schemaValidation = validate(response.data);
                if (!schemaValidation) {
                    schemaValidationErrors =
                        validate.errors?.map((error) => {
                            return {
                                message: error.message,
                                dataPath: error.instancePath,
                                schemaPath: error.schemaPath
                            };
                        }) || [];
                }
            } catch (error) {
                logger.error('Schema validation error:', error);
                schemaValidationErrors = [{ message: (error as Error).message }];
            }
        }

        const result: ApiCallResult = {
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
        const axiosError = error as AxiosError;
        logger.error(`API call error: ${axiosError.message}`);

        const result: ApiCallResult = {
            success: false,
            error: axiosError.message,
            statusCode: axiosError.response ? axiosError.response.status : undefined,
            statusText: axiosError.response ? axiosError.response.statusText : undefined,
            headers: axiosError.response ? axiosError.response.headers : {},
            responseBody: axiosError.response ? axiosError.response.data : null,
            schemaValidation: false,
            schemaValidationErrors: []
        };

        return result;
    }
}
