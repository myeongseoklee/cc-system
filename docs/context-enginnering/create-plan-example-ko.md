# BAML 테스트 Assertion 검증 구현 계획

## 개요

BAML 테스트가 경고 없이 `@assert`(단일 @) 구문을 잘못 수용하는 검증 이슈를 수정합니다. 이러한 필드 레벨 assertion은 런타임에서 조용히 무시됩니다. 테스트에는 블록 레벨 `@@assert`(이중 @) assertion만 올바르게 작동합니다.

## 현재 상태 분석

파서는 @(필드 레벨)와 @@(블록 레벨) 속성을 모두 유효한 문법으로 올바르게 수용하지만, 테스트 런타임은 블록 레벨 속성만 평가합니다. 테스트 필드의 필드 레벨 속성을 거부하는 의미론적 검증이 없습니다.

### 주요 발견사항:
- 파서는 `engine/baml-lib/ast/src/parser/parse_value_expression_block.rs:103-126`에서 두 구문을 모두 수용
- 테스트 visitor는 `engine/baml-lib/parser-database/src/types/configurations.rs:265-275`에서 블록 레벨 속성만 수집
- `engine/baml-lib/baml-core/src/validate/validation_pipeline/validations/tests.rs`에 필드 속성을 거부하는 검증이 존재하지 않음
- 유사한 검증 패턴이 `engine/baml-lib/parser-database/src/attributes/mod.rs:217`의 타입 별칭에 존재

## 구현하지 않을 것

- 파서 문법 변경 (두 구문을 모두 올바르게 수용함)
- 런타임 동작 수정 (블록 레벨 속성만 올바르게 사용함)
- 테스트에서 필드 레벨 assertion 지원 추가
- 블록 레벨 assertion 작동 방식 변경

## 구현 접근법

명확한 오류 메시지와 함께 테스트 필드의 `@assert` 및 `@check` 속성을 거부하는 의미론적 검증을 추가합니다. 타입 별칭 속성 제한에 사용된 기존 패턴을 따릅니다.

## Phase 1: 테스트의 필드 속성 검증 추가

### 개요
테스트 블록에서 필드 레벨 assertion 속성을 감지하고 거부하는 검증 로직을 추가합니다.

### 필요한 변경사항:

#### 1. 테스트 검증기 개선
**파일**: `engine/baml-lib/baml-core/src/validate/validation_pipeline/validations/tests.rs`
**변경사항**: validate 함수의 시작 부분에 검증 추가

```rust
pub(super) fn validate(ctx: &mut Context<'_>) {
    let tests = ctx.db.walk_test_cases().collect::<Vec<_>>();
    tests.iter().for_each(|walker| {
        // 신규: 테스트 필드에 @assert 또는 @check 속성이 없는지 검증
        let test_ast = walker.ast_node();
        for (_field_id, field) in test_ast.iter_fields() {
            for attr in field.attributes() {
                if attr.name() == "assert" || attr.name() == "check" {
                    ctx.push_error(DatamodelError::new_validation_error(
                        &format!(
                            "@{}는 테스트 필드에 허용되지 않습니다. 대신 테스트 블록 레벨에서 @@{}를 사용하세요.",
                            attr.name(),
                            attr.name()
                        ),
                        attr.span().clone(),
                    ));
                }
            }
        }

        // 기존: 제약 조건 검증 계속
        let constraints = &walker.test_case().constraints;
        // ... 나머지 기존 코드
```

### 성공 기준:

#### 자동 검증:
- [ ] 검증 테스트 통과: `cargo test test_validation test_field_assertions`
- [ ] 모든 기존 테스트 계속 통과: `cargo test`
- [ ] 린팅 통과: `cargo clippy`

#### 수동 검증:
- [ ] 테스트 필드에 @assert 사용 시 오류 메시지 표시
- [ ] 오류가 잘못된 속성의 정확한 위치를 가리킴
- [ ] 유효한 @@assert 사용에 대한 false positive 없음

---

## Phase 2: 검증 테스트 케이스 추가

### 개요
검증이 올바르게 작동하고 회귀를 방지하도록 테스트 케이스를 생성합니다.

### 필요한 변경사항:

#### 1. 테스트 파일 생성
**파일**: `engine/baml-lib/baml/tests/validation_files/functions_v2/tests/field_level_assertions.baml`
**변경사항**: 새 테스트 파일 생성

```baml
// 테스트에서 필드 레벨 assertion이 허용되지 않음을 테스트

test MyTest {
  functions [TestFunction]
  args {
    input "hello" @assert({{ this == "hello" }})
    count 5 @check(count_positive, {{ this > 0 }})
  }
}

function TestFunction(input: string, count: int) -> string {
  client "openai/gpt-4"
  prompt "Test function"
}

// error: @assert는 테스트 필드에 허용되지 않습니다. 대신 테스트 블록 레벨에서 @@assert를 사용하세요.
//   -->  functions_v2/tests/field_level_assertions.baml:6
//    |
//  6 |     input "hello" @assert({{ this == "hello" }})
//    |
// error: @check는 테스트 필드에 허용되지 않습니다. 대신 테스트 블록 레벨에서 @@check를 사용하세요.
//   -->  functions_v2/tests/field_level_assertions.baml:7
//    |
//  7 |     count 5 @check(count_positive, {{ this > 0 }})
//    |
```

### 성공 기준:

#### 자동 검증:
- [ ] 테스트 파일이 검증 테스트 스위트에 자동으로 포함됨
- [ ] `UPDATE_EXPECT=1`로 테스트 실행 시 예상 오류 메시지 생성
- [ ] 일반 실행 시 테스트 통과: `cargo test validation_test_field_level_assertions`

#### 수동 검증:
- [ ] 오류 메시지가 예상 형식과 일치
- [ ] Span이 올바른 속성 위치를 가리킴

---

## 테스트 전략

### 단위 테스트:
- 검증 테스트가 필드 속성이 거부되는지 확인
- 테스트가 @assert 및 @check 속성 모두를 커버
- 테스트가 오류 메시지 명확성을 검증

### 통합 테스트:
- 기존 테스트 스위트가 회귀가 없음을 보장
- 유효한 @@assert 테스트가 계속 작동

### 수동 테스트 단계:
1. 테스트 필드에 @assert를 포함한 BAML 파일 생성
2. BAML 검증 실행 및 오류 표시 확인
3. @@assert로 변경하고 올바르게 작동하는지 확인
4. @check 속성으로도 테스트

## 성능 고려사항

검증은 테스트 필드와 그 속성에 대한 중첩 루프를 추가하지만:
- 테스트 블록은 일반적으로 필드가 적음
- 필드는 일반적으로 속성이 적음
- 성능 영향은 기존 검증에 비해 무시할 만함

## 마이그레이션 노트

마이그레이션 불필요 - 이것은 잘못된 구문을 제대로 오류 처리하는 검증 전용 변경사항입니다.

## 참고자료

- 원본 티켓: `thoughts/shared/research/2025-08-05_05-15-59_baml_test_assertions.md`
- BAML 저장소의 이슈 #1252
- 유사한 구현: `engine/baml-lib/parser-database/src/attributes/mod.rs:217`
- 테스트 검증: `engine/baml-lib/baml-core/src/validate/validation_pipeline/validations/tests.rs`
