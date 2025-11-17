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
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.numeriquai.com',
			url: '/api/v1/auth/verify',
			method: 'GET',
			headers: {
				'X-API-Key': '={{$credentials.apiToken}}',
			},
		},
	};
}

export const numeriquaiApi = NumeriquaiApi;

