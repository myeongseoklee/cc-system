// enum.ts
export enum {{DomainName}}ExceptionEnum {
  {{EXCEPTION_CODE}} = '{{EXCEPTION_CODE}}',
}

// {{exception-name}}.exception.ts
import { BaseException } from '@exceptions';
import { {{DomainName}}ExceptionEnum } from './enum';

export class {{ExceptionName}}Exception extends BaseException {
  constructor({{params}}) {
    super({{DomainName}}ExceptionEnum.{{EXCEPTION_CODE}}, `{{message}}`);
  }
}

// index.ts
export * from './enum';
export * from './{{exception-name}}.exception';
