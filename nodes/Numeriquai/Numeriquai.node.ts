import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { executeFlatMerge } from './operations/flatMerge';
import { executeEvaluateRules } from './operations/evaluateRules';

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
					{ name: '1', value: 1 },
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
				default: 1,
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
			{
				displayName: 'Ignore Non-Existent Variable',
				name: 'ignore_non_existent_variable',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['evaluateRules'],
					},
				},
				default: false,
				description: 'Whether to ignore errors for non-existent variables',
			},
			{
				displayName: 'Ignore Incorrect Value Type',
				name: 'ignore_incorrect_value_type',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['evaluateRules'],
					},
				},
				default: false,
				description: 'Whether to ignore errors for incorrect value types',
			},
			{
				displayName: 'Ignore Non-Existent Enumeration',
				name: 'ignore_non_existent_enumeration',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['evaluateRules'],
					},
				},
				default: false,
				description: 'Whether to ignore errors for non-existent enumeration values',
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

