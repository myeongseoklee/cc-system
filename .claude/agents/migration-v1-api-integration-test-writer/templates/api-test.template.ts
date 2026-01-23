import databases from '@databases';
import {
  createAuthedRequest,
  getJSONData,
  getStatusCode,
  mockDatabase,
} from '@test-utils';
import handler from '../index';

// Database Mock 헬퍼 초기화
const db = mockDatabase();
(databases.tc as any).executeQuery = db.executeQuery;

describe('{{HTTP_METHOD}} /api/{{domainName}}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('정상: {{test_description}}', async () => {
    // Arrange
    const { req, res } = createAuthedRequest({
      method: '{{HTTP_METHOD}}',
      {{#if_query}}
      query: {
        {{query_params}}
      },
      {{/if_query}}
      {{#if_body}}
      body: {
        {{body_params}}
      },
      {{/if_body}}
    });

    {{#each_mockSP}}
    db.mockSelect('{{sp_name}}', [{{mock_data}}]);
    {{/each_mockSP}}

    // Act
    await handler(req, res);

    // Assert
    expect(getStatusCode(res)).toBe(200);
    const data = getJSONData(res);
    expect(data.success).toBe(true);
    {{assertions}}
  });

  test('정상: 데이터가 없는 경우 빈 배열 반환', async () => {
    // Arrange
    const { req, res } = createAuthedRequest({
      method: '{{HTTP_METHOD}}',
      query: { {{default_params}} },
    });

    db.mockSelect('{{sp_name}}', []);

    // Act
    await handler(req, res);

    // Assert
    expect(getStatusCode(res)).toBe(200);
    const data = getJSONData(res);
    expect(data.data.items).toEqual([]);
  });

  test('예외: {{required_param}}이 누락된 경우 에러', async () => {
    // Arrange
    const { req, res } = createAuthedRequest({
      method: '{{HTTP_METHOD}}',
      query: { /* missing {{required_param}} */ },
    });

    // Act
    await handler(req, res);

    // Assert
    expect(getStatusCode(res)).toBe(400);
  });
});
