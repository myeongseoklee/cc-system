import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {{EntityName}}Entity } from '../entity/{{entityName}}.entity';

@Injectable()
export class {{EntityName}}Repository {
  constructor(
    @InjectRepository({{EntityName}}Entity)
    private readonly repository: Repository<{{EntityName}}Entity>,
  ) {}

  /**
   * {{methodDescription}}
   */
  async {{methodName}}({{params}}): Promise<{{returnType}}> {
    {{#if_find_one}}
    return this.repository.findOne({
      where: { {{whereCondition}} },
    });
    {{/if_find_one}}
    {{#if_find_many}}
    return this.repository.find({
      where: { {{whereCondition}} },
      order: { createdAt: 'DESC' },
    });
    {{/if_find_many}}
    {{#if_save}}
    return this.repository.save(entity);
    {{/if_save}}
    {{#if_update}}
    await this.repository.update(id, data);
    {{/if_update}}
    {{#if_delete}}
    await this.repository.delete(id);
    {{/if_delete}}
  }
}

export default {{EntityName}}Repository;
