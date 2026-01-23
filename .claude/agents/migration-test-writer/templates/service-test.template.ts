import { {{serviceName}} } from '../{{serviceFile}}';
import usecase from '../usecase';

jest.mock('../usecase');

describe('{{serviceName}}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('성공: UseCase 호출 및 결과 반환', async () => {
    // Arrange
    const params = { {{params}} };
    const mockResult = [{ {{mockData}} }];
    jest.spyOn(usecase.{{usecaseName}}, 'exec').mockResolvedValue(mockResult);

    // Act
    const result = await {{serviceName}}(params);

    // Assert
    expect(result).toEqual(mockResult);
    expect(usecase.{{usecaseName}}.exec).toHaveBeenCalledWith({{expectedParams}});
  });

  test('성공: Switch 분기 - case1', async () => {
    // Arrange
    const params = { {{switchKey}}: '{{case1}}', {{otherParams}} };
    const mockResult = [{ {{mockData}} }];
    jest.spyOn(usecase.{{usecase1}}, 'exec').mockResolvedValue(mockResult);

    // Act
    const result = await {{serviceName}}(params);

    // Assert
    expect(result).toEqual(mockResult);
    expect(usecase.{{usecase1}}.exec).toHaveBeenCalled();
  });
});
