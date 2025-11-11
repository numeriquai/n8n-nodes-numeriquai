import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

export class ProcessApplication implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evaluate Rules',
		name: 'processApplication',
		icon: 'file:processApplication.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["guidelineId"]}}',
		description: 'Process application data from previous nodes by sending it to a backend API',
		defaults: {
			name: 'Evaluate Rules',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				displayName: 'Guideline ID',
				name: 'guidelineId',
				type: 'string',
				default: '',
				required: true,
				description: 'The guideline ID to process',
				placeholder: 'Enter guideline ID',
			},
			{
				displayName: 'Authentication Token',
				name: 'authToken',
				type: 'string',
				default: '',
				required: true,
				description: 'The bearer token for API authentication',
				typeOptions: {
					password: true,
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		console.log(`[ProcessApplication] Starting execution with ${items.length} items, ${JSON.stringify(items)}`);

		const input = items[0].json;

		try {
			console.log(`[ProcessApplication] Processing merged inputs from ${items.length} items`);

			const guidelineId = this.getNodeParameter('guidelineId', 0) as string;
			const authToken = this.getNodeParameter('authToken', 0) as string;
			const apiEndpoint = 'https://api.numeriquai.com/api/v1/audits/';

			// Validate required parameters
			if (!guidelineId) {
				console.error(`[ProcessApplication] Validation failed: Guideline ID is required`);
				throw new NodeOperationError(this.getNode(), 'Guideline ID is required');
			}
			if (!authToken) {
				console.error(`[ProcessApplication] Validation failed: Authentication token is required`);
				throw new NodeOperationError(this.getNode(), 'Authentication token is required');
			}
			if (!apiEndpoint) {
				console.error(`[ProcessApplication] Validation failed: API endpoint is required`);
				throw new NodeOperationError(this.getNode(), 'API endpoint is required');
			}

			console.log(`[ProcessApplication] All validations passed`);

			// Get current time for reference
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const timeStamp = `${hours}:${minutes}`;

			// Prepare request body with the required structure
			const requestBody = {
				reference: `Test run N8N guidline ${timeStamp}`,
				description: "N8N test",
				guideline_id: guidelineId,
				inputs: input,
			};

			console.log(`[ProcessApplication] Request body prepared:`, {
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
					Authorization: `Bearer ${authToken}`,
					'Content-Type': 'application/json',
				},
				timeout: 30000,
			};

			console.log(`[ProcessApplication] Making request to: ${ipv4Endpoint} (converted from ${apiEndpoint})`);
			console.log(`[ProcessApplication] Request headers:`, {
				'Content-Type': requestOptions.headers['Content-Type'],
				'Authorization': `Bearer ${authToken.substring(0, 10)}...`
			});

			// Test connectivity first
			try {
				const healthEndpoint = ipv4Endpoint.replace('/audits/', '/health').replace('/audits', '/health');
				console.log(`[ProcessApplication] Testing connectivity to ${healthEndpoint}`);
				const testResponse = await this.helpers.request({
					method: 'GET' as const,
					uri: healthEndpoint,
					timeout: 5000,
				});
				console.log(`[ProcessApplication] Health check response:`, testResponse);
			} catch (healthError) {
				console.warn(`[ProcessApplication] Health check failed (this is expected if no health endpoint):`, healthError instanceof Error ? healthError.message : String(healthError));
			}

			// Make API request
			console.log(`[ProcessApplication] Sending POST request...`);
			const responseData = await this.helpers.request(requestOptions);

			console.log(`[ProcessApplication] Request successful! Response received:`, {
				responseType: typeof responseData,
				responseKeys: typeof responseData === 'object' ? Object.keys(responseData) : 'not an object',
				responsePreview: JSON.stringify(responseData).substring(0, 200) + '...'
			});

			// Add response to return data
			returnData.push({
				json: responseData,
				pairedItem: { item: 0 },
			});

			console.log(`[ProcessApplication] Processing completed successfully`);

		} catch (error) {
			console.error(`[ProcessApplication] Error processing:`, {
				errorType: error instanceof Error ? error.constructor.name : typeof error,
				errorMessage: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
				errorCode: (error as any)?.code,
				errorStatus: (error as any)?.status,
				errorStatusText: (error as any)?.statusText,
				errorResponse: (error as any)?.response
			});

			if (this.continueOnFail()) {
				console.log(`[ProcessApplication] Continue on fail enabled, adding error to output`);
				returnData.push({
					json: {
						error: error instanceof Error ? error.message : String(error),
						errorType: error instanceof Error ? error.constructor.name : typeof error,
						errorCode: (error as any)?.code,
						errorStatus: (error as any)?.status
					},
					pairedItem: { item: 0 },
				});
			} else {
				console.error(`[ProcessApplication] Throwing error (continue on fail disabled)`);
				throw new NodeOperationError(this.getNode(), `API request failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		console.log(`[ProcessApplication] Execution completed. Returning ${returnData.length} items`);
		return [returnData];
	}
}
