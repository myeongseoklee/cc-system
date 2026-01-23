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

  // ========================================
  // 패턴 1: 전체 조회
  // ========================================
  async findAll(): Promise<{{EntityName}}Entity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ========================================
  // 패턴 2: ID로 단일 조회
  // ========================================
  async findById(id: string): Promise<{{EntityName}}Entity | null> {
    return this.repository.findOne({ where: { id } });
  }

  // ========================================
  // 패턴 3: 조건 조회 (예: customerId)
  // ========================================
  async findByCustomerId(
    customerId: string,
    options?: { page?: number; limit?: number },
  ): Promise<{{EntityName}}Entity[]> {
    const qb = this.repository
      .createQueryBuilder('{{entityName}}')
      .where('{{entityName}}.customerId = :customerId', { customerId })
      .orderBy('{{entityName}}.createdAt', 'DESC');

    if (options?.page && options?.limit) {
      qb.skip((options.page - 1) * options.limit).take(options.limit);
    }

    return qb.getMany();
  }

  // ========================================
  // 패턴 4: 저장 (Create/Update)
  // ========================================
  async save(entity: Partial<{{EntityName}}Entity>): Promise<{{EntityName}}Entity> {
    return this.repository.save(entity);
  }

  // ========================================
  // 패턴 5: 수정
  // ========================================
  async update(id: string, data: Partial<{{EntityName}}Entity>): Promise<void> {
    await this.repository.update(id, data);
  }

  // ========================================
  // 패턴 6: 삭제
  // ========================================
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ========================================
  // 패턴 7: 조건부 빈 배열 반환 (빈 입력 체크)
  // ========================================
  async findByIds(ids: string[]): Promise<{{EntityName}}Entity[]> {
    if (ids.length === 0) return [];
    return this.repository.findByIds(ids);
  }

  // ========================================
  // 패턴 8: 복잡한 필터 조회 (Query Builder)
  // ========================================
  async findWithFilters(filters: {
    customerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: {{EntityName}}Entity[]; total: number }> {
    const qb = this.repository.createQueryBuilder('{{entityName}}');

    if (filters.customerId) {
      qb.andWhere('{{entityName}}.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters.status) {
      qb.andWhere('{{entityName}}.status = :status', {
        status: filters.status,
      });
    }

    if (filters.startDate) {
      qb.andWhere('{{entityName}}.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      qb.andWhere('{{entityName}}.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [items, total] = await qb
      .orderBy('{{entityName}}.createdAt', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return { items, total };
  }
}

export default {{EntityName}}Repository;
