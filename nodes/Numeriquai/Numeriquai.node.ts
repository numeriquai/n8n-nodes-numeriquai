import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Deep merge two objects recursively
 */
export function deepMerge(target: IDataObject, source: IDataObject): IDataObject {
	const output = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			const sourceValue = source[key];
			const targetValue = target[key];
			if (
				typeof sourceValue === 'object' &&
				sourceValue !== null &&
				!Array.isArray(sourceValue) &&
				typeof targetValue === 'object' &&
				targetValue !== null &&
				!Array.isArray(targetValue)
			) {
				// Recursively merge nested objects
				output[key] = deepMerge(targetValue as IDataObject, sourceValue as IDataObject);
			} else {
				// Overwrite with source value
				output[key] = sourceValue;
			}
		}
	}

	return output;
}

/**
 * Safely parse JSON string, handling potential double wrapping
 */
function safeParseJSON(input: any): any {
	if (typeof input !== 'string') {
		return input;
	}

	const cleanInput = input.trim();

	try {
		return JSON.parse(cleanInput);
	} catch (error) {
		// Check for double braces {{ ... }}
		if (cleanInput.startsWith('{{') && cleanInput.endsWith('}}')) {
			try {
				const inner = cleanInput.slice(1, -1);
				return JSON.parse(inner);
			} catch (e) {
				// Ignore inner parse error
			}
		}
		return input;
	}
}

export class Numeriquai implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Numeriquai',
		name: 'numeriquai',
		icon: 'file:logo-numeriquai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] === "flatMerge" ? "Flat Merge" : "Evaluate Rules"}}',
		description: 'Numeriquai data processing tools',
		defaults: {
			name: 'Numeriquai',
		},
		codex: {
			categories: ['Data Transformation'],
			resources: {
				primaryDocumentation: [
					{
						url: 'https://numeriquai.com',
					},
				],
			},
		},
		inputs: '={{$parameter["operation"] === "flatMerge" ? Array($parameter["numberOfInputs"]).fill("main") : ["main"]}}',
		outputs: ['main'],
		credentials: [
			{
				name: 'numeriquaiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Flat Merge',
						value: 'flatMerge',
						description: 'Merge multiple input JSON items into a single streamlined JSON object',
						action: 'Flat merge',
					},
					{
						name: 'Evaluate Rules',
						value: 'evaluateRules',
						description: 'Evaluate rules against data',
						action: 'Evaluate rules',
					},
				],
				default: 'evaluateRules',
			},
			// Flat Merge properties
			{
				displayName: 'Number of Inputs',
				name: 'numberOfInputs',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['flatMerge'],
					},
				},
				options: [
					{ name: '2', value: 2 },
					{ name: '3', value: 3 },
					{ name: '4', value: 4 },
					{ name: '5', value: 5 },
					{ name: '6', value: 6 },
					{ name: '7', value: 7 },
					{ name: '8', value: 8 },
					{ name: '9', value: 9 },
					{ name: '10', value: 10 },
				],
				default: 2,
				required: true,
				description: 'Number of input connections to merge (add inputs using the + button on the node)',
			},
			// Evaluate Rules properties
			{
				displayName: 'Guideline ID',
				name: 'guidelineId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['evaluateRules'],
					},
				},
				default: '',
				required: true,
				description: 'The guideline ID to process',
				placeholder: 'Enter guideline ID',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'flatMerge') {
			return await executeFlatMerge.call(this);
		} else if (operation === 'evaluateRules') {
			return await executeEvaluateRules.call(this);
		}

		throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}

export async function executeFlatMerge(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const numberOfInputs = this.getNodeParameter('numberOfInputs', 0) as number;

		console.log(`[Numeriquai:FlatMerge] Starting execution with ${numberOfInputs} input connections using deep merge`);

		// Collect all items from all input connections
		const allItems: INodeExecutionData[] = [];
		for (let inputIndex = 0; inputIndex < numberOfInputs; inputIndex++) {
			const inputData = this.getInputData(inputIndex);
			allItems.push(...inputData);
			console.log(`[Numeriquai:FlatMerge] Input ${inputIndex + 1} has ${inputData.length} items`);
		}

		console.log(`[Numeriquai:FlatMerge] Total items to merge: ${allItems.length}`);

		// Merge all items into a single object using deep merge
		let mergedInputs: IDataObject = {};

		if (Array.isArray(allItems)) {
			for (const item of allItems) {
				let itemJson = { ...item.json };

				// Process values for JSON strings
				for (const key of Object.keys(itemJson)) {
					itemJson[key] = safeParseJSON(itemJson[key]);
				}

				// Always use deep merge to recursively merge nested objects
				mergedInputs = deepMerge(mergedInputs, itemJson);
			}
		} else if (typeof allItems === 'object' && allItems !== null) {
			mergedInputs = { ...(allItems as INodeExecutionData).json };
		}

		console.log(`[Numeriquai:FlatMerge] Final merged object has ${Object.keys(mergedInputs).length} keys: ${Object.keys(mergedInputs).join(', ')}`);

		// Ensure mergedInputs is an object, not an array
		if (Array.isArray(mergedInputs)) {
			console.warn(`[Numeriquai:FlatMerge] Warning: mergedInputs is an array, converting to object`);
			mergedInputs = mergedInputs.length > 0 ? mergedInputs[0] : {};
		}

		// Return the merged object as a single item
		returnData.push({
			json: mergedInputs,
			pairedItem: allItems.length > 0 ? allItems.map((_, index) => ({ item: index })) : [{ item: 0 }],
		});

		console.log(`[Numeriquai:FlatMerge] Execution completed successfully. Returning merged JSON object directly`);
	} catch (error) {
		console.error(`[Numeriquai:FlatMerge] Error processing:`, {
			errorType: error instanceof Error ? error.constructor.name : typeof error,
			errorMessage: error instanceof Error ? error.message : String(error),
		});

		if (this.continueOnFail()) {
			returnData.push({
				json: {
					error: error instanceof Error ? error.message : String(error),
					errorType: error instanceof Error ? error.constructor.name : typeof error,
				},
				pairedItem: { item: 0 },
			});
		} else {
			throw new NodeOperationError(this.getNode(), `Merge failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return [returnData];
}

export async function executeEvaluateRules(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	console.log(`[Numeriquai:EvaluateRules] Starting execution with ${items.length} items`);

	const input = items[0].json;

	try {
		const guidelineId = this.getNodeParameter('guidelineId', 0) as string;
		const credentials = await this.getCredentials('numeriquaiApi');

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'Credentials are required');
		}

		const apiToken = credentials.apiToken as string;
		// Get API URL from credentials, default to standard endpoint if not provided
		const apiUrl = (credentials.apiUrl as string) || 'https://api.numeriquai.com';
		const apiEndpoint = `${apiUrl}/api/v1/audits/`;

		// Validate required parameters
		if (!guidelineId) {
			throw new NodeOperationError(this.getNode(), 'Guideline ID is required');
		}
		if (!apiToken) {
			throw new NodeOperationError(this.getNode(), 'API Key is required');
		}

		console.log(`[Numeriquai:EvaluateRules] All validations passed`);

		// Get current time for reference
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const timeStamp = `${hours}:${minutes}`;

		// Prepare request body
		const requestBody = {
			reference: `Application run N8N guideline ${timeStamp}`,
			description: "N8N application run",
			guideline_id: guidelineId,
			inputs: input,
		};

		console.log(`[Numeriquai:EvaluateRules] Request body prepared:`, {
			reference: requestBody.reference,
			description: requestBody.description,
			guideline_id: requestBody.guideline_id,
			inputKeys: Object.keys(input)
		});

		// Convert localhost to IPv4 address to avoid IPv6 issues
		const ipv4Endpoint = apiEndpoint.replace('localhost', '127.0.0.1');

		// Log request details
		const requestOptions = {
			method: 'POST' as const,
			url: ipv4Endpoint,
			body: requestBody,
			json: true,
			headers: {
				"X-API-Key": `${apiToken}`,
				'Content-Type': 'application/json',
			},
			timeout: 30000,
		};

		console.log(`[Numeriquai:EvaluateRules] Making request to: ${ipv4Endpoint}`);

		// Make API request
		const responseData = await this.helpers.httpRequest(requestOptions);

		console.log(`[Numeriquai:EvaluateRules] Request successful!`);

		// Add response to return data
		returnData.push({
			json: responseData,
			pairedItem: { item: 0 },
		});

		console.log(`[Numeriquai:EvaluateRules] Processing completed successfully`);

	} catch (error) {
		console.error(`[Numeriquai:EvaluateRules] Error processing:`, {
			errorType: error instanceof Error ? error.constructor.name : typeof error,
			errorMessage: error instanceof Error ? error.message : String(error),
		});

		console.log(`[Numeriquai:EvaluateRules] Error structure:`, JSON.stringify(error, null, 2));

		// Extract error message, including detail from data if available
		// Check multiple possible locations for the detail field
		let errorMessage = error instanceof Error ? error.message : String(error);
		const errorAny = error as any;
		
		// Try to extract detail from various possible locations
		let errorDetail = errorAny?.data?.detail || errorAny?.response?.data?.detail || errorAny?.detail;
		
		// If not found, try parsing response body if it's a string
		if (!errorDetail && errorAny?.response?.body) {
			try {
				const body = typeof errorAny.response.body === 'string' 
					? JSON.parse(errorAny.response.body) 
					: errorAny.response.body;
				errorDetail = body?.detail || body?.data?.detail;
			} catch (e) {
				// Ignore JSON parse errors
			}
		}
		
		// Also check if response.data exists directly
		if (!errorDetail && errorAny?.response?.data) {
			errorDetail = errorAny.response.data.detail;
		}
		
		if (errorDetail) {
			errorMessage = `${errorMessage}: ${errorDetail}`;
		}

		if (this.continueOnFail()) {
			returnData.push({
				json: {
					error: errorMessage,
					errorType: error instanceof Error ? error.constructor.name : typeof error,
					...(errorDetail && { detail: errorDetail }),
				},
				pairedItem: { item: 0 },
			});
		} else {
			throw new NodeOperationError(this.getNode(), `API request failed: ${errorMessage}`);
		}
	}

	console.log(`[Numeriquai:EvaluateRules] Execution completed. Returning ${returnData.length} items`);
	return [returnData];
}

