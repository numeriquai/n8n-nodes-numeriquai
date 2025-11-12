import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class NumeriquaiApi implements ICredentialType {
	name = 'numeriquaiApi';

	displayName = 'Numeriquai API';

	documentationUrl = 'https://numeriquai.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
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
		},
	];
}

export const numeriquaiApi = NumeriquaiApi;

