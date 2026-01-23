/**
 * Service-to-Service Dependency Integration Tests
 *
 * Tests cross-domain service calls to ensure v1 dependencies are captured.
 * These tests will be used to verify v2 maintains 100% functional equivalence.
 */

import { mockDatabaseWithTransaction } from '@test-utils';
import databases from '@databases';

// Import services
import {{callerDomainName}}Service from '@modules/domain/{{callerDomainName}}/service';
import {{currentDomainName}}Service from '@modules/domain/{{currentDomainName}}/service';

describe('{{currentDomainName}} service dependencies', () => {
	let db: ReturnType<typeof mockDatabaseWithTransaction>;

	beforeEach(() => {
		db = mockDatabaseWithTransaction();
		(databases as any).tc = db.tc;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	/**
	 * Test: {{callerDomainName}}.{{callerFunctionName}} → {{currentDomainName}}.{{currentFunctionName}}
	 *
	 * Reference from v1-analysis.json:
	 * - File: {{referenceFile}}
	 * - Line: {{referenceLine}}
	 * - Context: {{referenceContext}}
	 */
	test('{{callerDomainName}}.{{callerFunctionName}} → {{currentDomainName}}.{{currentFunctionName}}', async () => {
		// Arrange: Mock DB calls for both domains
		db.mockSelectOnce({{currentDomainMockData}})  // {{currentDomainName}} domain
			.mockSelectOnce({{callerDomainMockData}});   // {{callerDomainName}} domain

		// Act: Call caller service (which internally calls current domain)
		const result = await {{callerDomainName}}Service.{{callerFunctionName}}({{callerFunctionArgs}});

		// Assert: Verify current domain was called
		expect(db.executeQuery).toHaveBeenCalledWith(
			'{{currentDomainStoredProcedure}}',
			expect.any(Array)
		);
		expect(result).toBeDefined();
	});
});
