import { ICredentialType, INodeProperties } from 'n8n-workflow';

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
}

export const numeriquaiApi = NumeriquaiApi;

