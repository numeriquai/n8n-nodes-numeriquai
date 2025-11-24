import { IDataObject } from 'n8n-workflow';

/**
 * Deep merge two objects recursively
 */
export function deepMerge(target: IDataObject, source: IDataObject): IDataObject {
	const output = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			const sourceValue = source[key];
			const targetValue = target[key];
			if (
				typeof sourceValue === 'object' &&
				sourceValue !== null &&
				!Array.isArray(sourceValue) &&
				typeof targetValue === 'object' &&
				targetValue !== null &&
				!Array.isArray(targetValue)
			) {
				// Recursively merge nested objects
				output[key] = deepMerge(targetValue as IDataObject, sourceValue as IDataObject);
			} else {
				// Overwrite with source value
				output[key] = sourceValue;
			}
		}
	}

	return output;
}

/**
 * Safely parse JSON string, handling potential double wrapping
 */
export function safeParseJSON(input: unknown): unknown {
	if (typeof input !== 'string') {
		return input;
	}

	const cleanInput = input.trim();

	try {
		return JSON.parse(cleanInput);
	} catch (error) {
		// Check for double braces {{ ... }}
		if (cleanInput.startsWith('{{') && cleanInput.endsWith('}}')) {
			try {
				const inner = cleanInput.slice(1, -1);
				return JSON.parse(inner);
			} catch (e) {
				// Ignore inner parse error
			}
		}
		return input;
	}
}

