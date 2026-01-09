import { {{UseCaseName}} } from '../{{usecaseFile}}';
import { tc } from '../repository';

jest.mock('../repository');

describe('{{UseCaseName}}', () => {
  let usecase: {{UseCaseName}};

  beforeEach(() => {
    usecase = new {{UseCaseName}}();
    jest.clearAllMocks();
  });

  test('성공: Repository 호출 및 결과 반환', async () => {
    // Arrange
    const {{param1}} = {{value1}};
    const {{param2}} = {{value2}};
    const mockData = [{ {{mockData}} }];
    jest.spyOn(tc.{{repositoryName}}, '{{method}}').mockResolvedValue(mockData);

    // Act
    const result = await usecase.exec({{param1}}, {{param2}});

    // Assert
    expect(result).toEqual(mockData);
    expect(tc.{{repositoryName}}.{{method}}).toHaveBeenCalledWith({{param1}}, {{param2}}, undefined);
  });

  test('성공: 복잡한 로직 (여러 Repository 호출 + 변환)', async () => {
    // Arrange
    const {{param1}} = {{value1}};
    const {{param2}} = {{value2}};
    const mockList1 = [{ {{field}}: {{mockValue1}} }];
    const mockList2 = [{ {{field1}}: {{mockValue1}}, {{field2}}: '{{mockValue2}}' }];
    jest.spyOn(tc.{{repository1}}, '{{method1}}').mockResolvedValue(mockList1);
    jest.spyOn(tc.{{repository2}}, '{{method2}}').mockResolvedValue(mockList2);

    // Act
    const result = await usecase.exec({{param1}}, {{param2}});

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ {{expectedField}}: {{expectedValue}} });
    expect(tc.{{repository1}}.{{method1}}).toHaveBeenCalledWith({{param2}});
    expect(tc.{{repository2}}.{{method2}}).toHaveBeenCalled();
  });

  test('실패: {{errorCase}}', async () => {
    // Arrange
    const {{invalidParam}} = {{invalidValue}};

    // Act & Assert
    await expect(usecase.exec({{invalidParam}})).rejects.toThrow({{ExceptionName}});
  });
});
