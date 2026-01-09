import { {{DtoName}} } from '../{{dtoFile}}';

describe('{{DtoName}}', () => {
  test('성공: 올바른 데이터 파싱', () => {
    // Arrange
    const input = { {{validData}} };

    // Act
    const result = {{DtoName}}.parse(input);

    // Assert
    expect(result).toMatchObject({ {{expectedData}} });
  });

  test('실패: 필수 필드 누락', () => {
    // Arrange
    const input = { {{missingField}} };

    // Act & Assert
    expect(() => {{DtoName}}.parse(input)).toThrow();
  });

  test('성공: transform 체이닝 (enum → number 변환)', () => {
    // Arrange
    const input = { {{field}}: '{{enumValue1}}', {{otherFields}} };

    // Act
    const result = {{DtoName}}.parse(input);

    // Assert
    expect(result.{{field}}).toBe({{expectedNumber}});
  });

  test('성공: getOffset 변환 (pageNo → offset)', () => {
    // Arrange
    const input = { pageNo: 2, pageSize: 10, {{otherFields}} };

    // Act
    const result = {{DtoName}}.parse(input);

    // Assert
    expect(result).toHaveProperty('offset', 10);
    expect(result).not.toHaveProperty('pageNo');
  });

  test('성공: Base DTO extend', () => {
    // Arrange
    const input = { {{baseFields}}, {{extendedField}}: {{value}} };

    // Act
    const result = {{DtoName}}.parse(input);

    // Assert
    expect(result).toMatchObject({ {{baseFields}}, {{extendedField}}: {{value}} });
  });
});
