import databases from '@databases';
import { createAuthedRequest, getJSONData, getStatusCode, mockDatabase } from '@test-utils';
import handler from '../index';

const db = mockDatabase();
(databases.tc as any).executeQuery = db.executeQuery;

describe('GET /api/v2/{{domainName}}', () => {
  beforeEach(() => jest.clearAllMocks());

  test('정상: {{testDescription}}', async () => {
    // Arrange
    const { req, res } = createAuthedRequest({
      method: 'GET',
      query: { {{queryParams}} },
    });

    db.mockSelect('{{spName}}', [{{mockData}}]);

    // Act
    await handler(req, res);

    // Assert
    expect(getStatusCode(res)).toBe(200);
    const data = getJSONData(res);
    expect(data.success).toBe(true);
    {{assertions}}
  });
});
