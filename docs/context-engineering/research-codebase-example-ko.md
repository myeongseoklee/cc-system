---
date: 2025-08-05T05:15:59Z
researcher: dex
git_commit: 63f45d4b34b4682b297e024e5ac96b15030a2fcf
branch: canary
repository: baml
topic: "BAML 테스트 Assertion - @assert vs @@assert 이슈 #1252"
tags: [research, codebase, baml, test-assertions, linter, validation]
status: complete
last_updated: 2025-08-05
last_updated_by: dex
---

# 리서치: BAML 테스트 Assertion - @assert vs @@assert 이슈 #1252

**날짜**: 2025-08-05T05:15:59Z
**연구자**: dex
**Git 커밋**: 63f45d4b34b4682b297e024e5ac96b15030a2fcf
**브랜치**: canary
**저장소**: baml

## 리서치 질문
이슈 #1252는 BAML 테스트가 @assert(단일 @) 문법을 린터 경고 없이 잘못 수용하지만, 이러한 assertion은 런타임에서 조용히 무시된다고 보고합니다. 오직 @@assert(이중 @) assertion만 테스트 실행 중에 실제로 평가됩니다. 왜 이런 일이 발생하는지, 그리고 어디서 수정해야 하는지 이해가 필요합니다.

## 요약
이슈가 발생하는 이유:
1. **파서가 두 문법을 모두 수용**: 파서는 테스트 필드의 필드 속성(@)을 올바르게 파싱합니다
2. **검증이 존재하지 않음**: 테스트 필드의 @ 속성을 잘못된 것으로 표시하는 린터 검증이 없습니다
3. **런타임이 필드 속성을 무시**: `visit_test_case` 함수는 블록 레벨(@@) 속성만 수집하므로, 필드 레벨(@) assertion은 테스트의 제약 조건 목록에 추가되지 않습니다

수정 방법은 간단합니다: 테스트 검증기에서 테스트 필드의 @assert 및 @check 속성을 명확한 오류 메시지와 함께 거부하는 검증을 추가합니다.

## 상세 분석

### 테스트 블록 파싱
- 테스트 블록은 `engine/baml-lib/ast/src/parser/parse_value_expression_block.rs`에서 파싱됩니다
- 테스트 블록은 `ValueExprBlockType::Test`로 식별됩니다 (라인 34, 65, 106)
- 블록 속성(@@)은 라인 103-126에서 파싱됩니다
- 필드 속성(@)은 필드의 값 표현식을 파싱할 때 파싱됩니다

### 속성 문법
`engine/baml-lib/ast-lsp/src/lib/internal_ast/src/parser/datamodel.pest`에서:
- `field_attribute = { "@" ~ identifier ~ arguments_list? }` (라인 176)
- `block_attribute = { "@@" ~ identifier ~ arguments_list? }` (라인 175)
- 두 문법 모두 문법적으로는 유효하지만, 의미론적으로 @는 테스트 필드에 사용되어서는 안 됩니다

### 테스트 제약 조건 수집 (버그 발생 지점)
`engine/baml-lib/parser-database/src/types/configurations.rs:203-300`에서:
```rust
fn visit_test_case(config: &ConfigBlockProperty, db: &mut ParserDatabase) {
    // ... 설정 코드 ...

    // config.attributes(블록 레벨 @@)에서만 제약 조건을 수집
    let constraints = constraint::visit_constraint_attributes(config.attributes.clone(), db);

    // 개별 필드의 필드 속성(@)은 완전히 무시됨
    // 제약 조건을 위해 f.attributes를 처리하는 코드가 없음
}
```

### 런타임 Assertion 평가
1. **필드 제약 조건은 파싱 중에 평가됩니다**:
   - `engine/baml-lib/jsonish/src/deserializer/coercer/ir_ref/coerce_class.rs:481-488` - `apply_constraints`가 호출됨
   - 제약 조건이 평가되고 결과가 플래그로 저장됨

2. **하지만 테스트 실행은 블록 레벨 제약 조건만 확인합니다**:
   - `engine/baml-runtime/src/lib.rs:356-373` - `get_test_constraints`는 테스트 블록 제약 조건만 검색
   - `engine/baml-runtime/src/lib.rs:546-561` - `evaluate_test_constraints`는 블록 레벨 제약 조건만 평가
   - 필드 레벨 제약 조건 결과는 테스트 통과/실패 결정에서 무시됨

### 수정 위치
검증은 `engine/baml-lib/baml-core/src/validate/validation_pipeline/validations/tests.rs`에 추가되어야 합니다:
```rust
// validate 함수의 시작 부분에
let test_ast = walker.ast_node();
for (_field_id, field) in test_ast.iter_fields() {
    for attr in field.attributes() {
        if attr.name() == "assert" || attr.name() == "check" {
            ctx.push_error(DatamodelError::new_validation_error(
                &format!(
                    "@{}는 테스트 필드에 허용되지 않습니다. 이러한 속성은 타입 필드(클래스에서) 또는 테스트의 블록 레벨 속성으로만 사용할 수 있습니다.",
                    attr.name()
                ),
                attr.span().clone(),
            ));
        }
    }
}
```

## 코드 레퍼런스
- `engine/baml-lib/ast/src/parser/parse_value_expression_block.rs:103-126` - 테스트의 블록 속성 파싱
- `engine/baml-lib/parser-database/src/types/configurations.rs:203-300` - 테스트 케이스 visitor (필드 속성 무시)
- `engine/baml-lib/baml-core/src/validate/validation_pipeline/validations/tests.rs` - 검증이 추가되어야 할 위치
- `engine/baml-runtime/src/lib.rs:356-373` - 런타임은 블록 레벨 제약 조건만 사용

## 아키텍처 인사이트
1. **속성 시스템 설계**:
   - 단일 `@` = 필드 레벨 속성 (클래스 필드, 함수 매개변수용)
   - 이중 `@@` = 블록 레벨 속성 (전체 블록용: 클래스, 함수, 테스트)
   - 테스트는 블록이므로 assertion을 위해 `@@`가 필요함

2. **검증 격차**:
   - 파서는 두 문법을 모두 수용 (올바르게, 유효한 문법이므로)
   - 테스트 필드의 @를 거부하는 의미론적 검증이 없음
   - 런타임은 테스트에서 @@만 사용된다고 가정

3. **깔끔한 아키텍처**:
   - 파싱(구문)과 검증(의미론) 간의 명확한 분리
   - 수정은 파서가 아닌 검증 레이어에 속함

## 역사적 맥락 (thoughts/에서)
- `thoughts/shared/issues/issue-1252.md` - 원래 이슈 보고서 포함 (ENG-1252)
- 이슈는 명시적으로 명시: "테스트는 @@assert만 허용하므로 린터 오류를 표시해야 함"
- 변경 로그는 `@@assert` 구문 강조 수정을 언급하며, 올바른 처리에 대한 지속적인 작업을 나타냄

## 관련 리서치
thoughts/shared/research/에서 아직 발견되지 않음.

## 열린 질문
1. 오류 메시지에 올바른 구문(@@assert)을 제안해야 하나요?
2. 필드 속성이 잘못 수용되는 다른 컨텍스트가 있나요?
3. 이 검증이 올바르게 작동하는지 확인하기 위해 테스트 케이스를 추가해야 하나요?
