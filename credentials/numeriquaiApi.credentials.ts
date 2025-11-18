import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class NumeriquaiApi implements ICredentialType {
	name = 'numeriquaiApi';

	displayName = 'Numeriquai API';

	documentationUrl = 'https://numeriquai.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.numeriquai.com',
			description: 'The base URL for the Numeriquai API. Leave as default for standard endpoint, or enter custom URL (e.g., https://api-saaf.numeriquai.com)',
			placeholder: 'https://api.numeriquai.com',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl || "https://api.numeriquai.com"}}',
			url: '/api/v1/auth/verify',
			method: 'GET',
			headers: {
				'X-API-Key': '={{$credentials.apiToken}}',
			},
		},
	};
}

export const numeriquaiApi = NumeriquaiApi;

