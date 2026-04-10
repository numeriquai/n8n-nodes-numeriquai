import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { deepMerge, safeParseJSON } from '../utils';

export async function executeFlatMerge(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const numberOfInputs = this.getNodeParameter('numberOfInputs', 0) as number;

		// Collect all items from all input connections
		const allItems: INodeExecutionData[] = [];
		for (let inputIndex = 0; inputIndex < numberOfInputs; inputIndex++) {
			const inputData = this.getInputData(inputIndex);
			allItems.push(...inputData);
		}

		// Merge all items into a single object using deep merge
		let mergedInputs: IDataObject = {};

		if (Array.isArray(allItems)) {
			for (const item of allItems) {
				const itemJson = { ...item.json };

				// Process values for JSON strings
				for (const key of Object.keys(itemJson)) {
					itemJson[key] = safeParseJSON(itemJson[key]) as IDataObject[keyof IDataObject];
				}

				// Always use deep merge to recursively merge nested objects
				mergedInputs = deepMerge(mergedInputs, itemJson);
			}
		} else if (typeof allItems === 'object' && allItems !== null) {
			mergedInputs = { ...(allItems as INodeExecutionData).json };
		}

		// Ensure mergedInputs is an object, not an array
		if (Array.isArray(mergedInputs)) {
			mergedInputs = mergedInputs.length > 0 ? mergedInputs[0] : {};
		}

		// Return the merged object as a single item
		returnData.push({
			json: mergedInputs,
			pairedItem: allItems.length > 0 ? allItems.map((_, index) => ({ item: index })) : [{ item: 0 }],
		});

	} catch (error) {
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

