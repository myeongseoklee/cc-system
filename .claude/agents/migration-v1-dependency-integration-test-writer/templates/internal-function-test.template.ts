/**
 * Internal Function Chain Integration Tests
 *
 * Tests internal function calls within the same domain.
 * Ensures v1 function chains are captured for v2 migration.
 */

import { mockDatabaseWithTransaction } from '@test-utils';
import databases from '@databases';

// Import service
import {{domainName}}Service from '@modules/domain/{{domainName}}/service';

describe('{{domainName}} internal function chains', () => {
	let db: ReturnType<typeof mockDatabaseWithTransaction>;

	beforeEach(() => {
		db = mockDatabaseWithTransaction();
		(databases as any).tc = db.tc;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	/**
	 * Test: {{callerFunctionName}} calls {{calleeFunctionName}} internally
	 *
	 * Reference from v1-analysis.json:
	 * - Call graph: {{callerFunctionName}} → {{calleeFunctionName}}
	 * - Type: internal-call
	 * - Purpose: {{callPurpose}}
	 */
	test('{{callerFunctionName}} calls {{calleeFunctionName}} internally', async () => {
		// Arrange: Mock internal function calls in sequence
		db.mockSelectOnce({{calleeMockData}})    // {{calleeFunctionName}} call
			.mockMutationOnce({{callerMutationRows}});  // {{callerFunctionName}} mutation

		// Act: Call parent function
		const result = await {{domainName}}Service.{{callerFunctionName}}({{callerArgs}});

		// Assert: Verify call order
		expect(db.executeQuery).toHaveBeenNthCalledWith(1,
			'{{calleeStoredProcedure}}',
			{{calleeArgs}}
		);
		expect(db.executeQuery).toHaveBeenNthCalledWith(2,
			'{{callerStoredProcedure}}',
			{{callerStoredProcedureArgs}}
		);
		expect(result).toBeDefined();
	});

	/**
	 * Test: {{callerFunctionName}} validates via {{calleeFunctionName}} before action
	 *
	 * Common pattern: Validation → Action
	 */
	test('{{callerFunctionName}} validates via {{calleeFunctionName}} before action', async () => {
		// Arrange: Mock validation and action
		db.mockSelectOnce({{validationMockData}})
			.mockMutationOnce({{actionMutationRows}});

		// Act
		await {{domainName}}Service.{{callerFunctionName}}({{callerArgs}});

		// Assert: Validation happened before action
		expect(db.executeQuery).toHaveBeenCalledTimes(2);
		expect(db.executeQuery).toHaveBeenNthCalledWith(1,
			'{{calleeStoredProcedure}}', // Validation SP
			expect.any(Array)
		);
	});

	/**
	 * Test: {{callerFunctionName}} error handling when {{calleeFunctionName}} fails
	 *
	 * Tests internal dependency failure scenarios
	 */
	test('{{callerFunctionName}} handles {{calleeFunctionName}} failure', async () => {
		// Arrange: Internal function returns empty/null
		db.mockSelectOnce([]);  // {{calleeFunctionName}} fails

		// Act & Assert: Should throw error
		await expect(
			{{domainName}}Service.{{callerFunctionName}}({{callerArgs}})
		).rejects.toThrow('{{expectedErrorMessage}}');
	});
});
