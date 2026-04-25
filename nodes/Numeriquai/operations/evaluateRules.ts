import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';

export async function executeEvaluateRules(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const input = items[0].json;

	try {
		const guidelineId = this.getNodeParameter('guidelineId', 0) as string;
		const errorOnNonExistentVariable = this.getNodeParameter('error_on_non_existent_variable', 0) as boolean;
		const errorOnIncorrectValueType = this.getNodeParameter('error_on_incorrect_value_type', 0) as boolean;
		const errorOnNonExistentEnumeration = this.getNodeParameter('error_on_non_existent_enumeration', 0) as boolean;
		const ruleIdsRaw = this.getNodeParameter('ruleIds', 0, '') as string;
		const credentials = await this.getCredentials('numeriquaiApi');

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'Credentials are required');
		}

		const apiToken = credentials.apiToken as string;
		// Get API URL from credentials, default to standard endpoint if not provided
		const apiUrl = (credentials.apiUrl as string) || 'https://api.numeriquai.com';
		const apiEndpoint = `${apiUrl}/api/v1/audits`;

		// Validate required parameters
		if (!guidelineId) {
			throw new NodeOperationError(this.getNode(), 'Guideline ID is required');
		}
		if (!apiToken) {
			throw new NodeOperationError(this.getNode(), 'API Key is required');
		}

		// Get current time for reference
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const timeStamp = `${hours}:${minutes}`;

		// Prepare request body
		const requestBody: {
			reference: string;
			description: string;
			guideline_id: string;
			inputs: unknown;
			error_on_non_existent_variable: boolean;
			error_on_incorrect_value_type: boolean;
			error_on_non_existent_enumeration: boolean;
			rule_ids?: string[];
		} = {
			reference: `Application run N8N guideline ${timeStamp}`,
			description: "N8N application run",
			guideline_id: guidelineId,
			inputs: input,
			error_on_non_existent_variable: errorOnNonExistentVariable,
			error_on_incorrect_value_type: errorOnIncorrectValueType,
			error_on_non_existent_enumeration: errorOnNonExistentEnumeration,
		};

		if (ruleIdsRaw.trim()) {
			requestBody.rule_ids = ruleIdsRaw.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
		}

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

		// Make API request
		const responseData = await this.helpers.httpRequest(requestOptions);

		// Add response to return data
		returnData.push({
			json: responseData,
			pairedItem: { item: 0 },
		});

	} catch (error) {
		// Extract error message, including detail from data if available
		// Check multiple possible locations for the detail field
		let errorMessage = error instanceof Error ? error.message : String(error);
		const errorAny = error as unknown as { data?: { detail?: string }; response?: { data?: { detail?: string }; body?: string | unknown }; detail?: string };
		
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

	return [returnData];
}

