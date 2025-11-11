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
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
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

export class MergeInputs implements INodeType {
	description: INodeTypeDescription & { maxNumberOfInputs?: number } = {
		displayName: 'Flat Merge',
		name: 'mergeInputs',
		icon: 'file:mergeInputs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["numberOfInputs"]}} inputs',
		description: 'Deep merge multiple input JSON items from different connections into a single streamlined JSON object',
		defaults: {
			name: 'Flat Merge',
		},
		// @ts-ignore - Dynamic inputs using expression syntax
		inputs: '={{ Array($parameter["numberOfInputs"]).fill("main") }}',
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				displayName: 'Number of Inputs',
				name: 'numberOfInputs',
				type: 'options',
				options: [
					{
						name: '2',
						value: 2,
					},
					{
						name: '3',
						value: 3,
					},
					{
						name: '4',
						value: 4,
					},
					{
						name: '5',
						value: 5,
					},
					{
						name: '6',
						value: 6,
					},
					{
						name: '7',
						value: 7,
					},
					{
						name: '8',
						value: 8,
					},
					{
						name: '9',
						value: 9,
					},
					{
						name: '10',
						value: 10,
					},
				],
				default: 2,
				required: true,
				description: 'Number of input connections to merge (add inputs using the + button on the node)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		try {
			const numberOfInputs = this.getNodeParameter('numberOfInputs', 0) as number;

			console.log(`[MergeInputs] Starting execution with ${numberOfInputs} input connections using deep merge`);

			// Collect all items from all input connections
			const allItems: INodeExecutionData[] = [];
			for (let inputIndex = 0; inputIndex < numberOfInputs; inputIndex++) {
				const inputData = this.getInputData(inputIndex);
				allItems.push(...inputData);
				console.log(`[MergeInputs] Input ${inputIndex + 1} has ${inputData.length} items`);
			}

			console.log(`[MergeInputs] Total items to merge: ${allItems.length}`);

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

			console.log(`[MergeInputs] Final merged object has ${Object.keys(mergedInputs).length} keys: ${Object.keys(mergedInputs).join(', ')}`);

			// Ensure mergedInputs is an object, not an array
			if (Array.isArray(mergedInputs)) {
				console.warn(`[MergeInputs] Warning: mergedInputs is an array, converting to object`);
				mergedInputs = mergedInputs.length > 0 ? mergedInputs[0] : {};
			}

			// Return the merged object as a single item - the json property contains the merged object directly
			returnData.push({
				json: mergedInputs,
				pairedItem: allItems.length > 0 ? allItems.map((_, index) => ({ item: index })) : [{ item: 0 }],
			});

			console.log(`[MergeInputs] Execution completed successfully. Returning merged JSON object directly`);
		} catch (error) {
			console.error(`[MergeInputs] Error processing:`, {
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
}

