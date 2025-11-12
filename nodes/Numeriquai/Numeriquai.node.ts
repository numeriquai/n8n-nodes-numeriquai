import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Deep merge two objects recursively
 */
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
	const output = { ...target };

	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			if (
				typeof source[key] === 'object' &&
				source[key] !== null &&
				!Array.isArray(source[key]) &&
				typeof target[key] === 'object' &&
				target[key] !== null &&
				!Array.isArray(target[key])
			) {
				// Recursively merge nested objects
				output[key] = deepMerge(target[key], source[key]);
			} else {
				// Overwrite with source value
				output[key] = source[key];
			}
		}
	}

	return output;
}

export class Numeriquai implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Numeriquai',
		name: 'numeriquai',
		icon: 'file:logo-numeriquai.png',
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
						action: 'Flat Merge',
					},
					{
						name: 'Evaluate Rules',
						value: 'evaluateRules',
						description: 'Evaluate rules against data.',
						action: 'Evaluate Rules',
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
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
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
			let mergedInputs: Record<string, any> = {};

			if (Array.isArray(allItems)) {
				for (const item of allItems) {
					const itemJson = (item as any as { json: Record<string, any> }).json;
					// Always use deep merge to recursively merge nested objects
					mergedInputs = deepMerge(mergedInputs, itemJson);
				}
			} else if (typeof allItems === 'object' && allItems !== null) {
				mergedInputs = { ...(allItems as any as { json: Record<string, any> }).json };
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
			const apiUrl = 'https://api.numeriquai.com';
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
				reference: `Test run N8N guidline ${timeStamp}`,
				description: "N8N test",
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
				uri: ipv4Endpoint,
				body: requestBody,
				json: true,
				headers: {
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				timeout: 30000,
			};

			console.log(`[Numeriquai:EvaluateRules] Making request to: ${ipv4Endpoint}`);

			// Make API request
			const responseData = await this.helpers.request(requestOptions);

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

			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error instanceof Error ? error.message : String(error),
						errorType: error instanceof Error ? error.constructor.name : typeof error,
					},
					pairedItem: { item: 0 },
				});
			} else {
				throw new NodeOperationError(this.getNode(), `API request failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		console.log(`[Numeriquai:EvaluateRules] Execution completed. Returning ${returnData.length} items`);
		return [returnData];
}

