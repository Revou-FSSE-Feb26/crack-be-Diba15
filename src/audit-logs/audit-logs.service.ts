import { Inject, Injectable } from '@nestjs/common';
import type { AuditLogsRepositoryInterface } from '../common/interfaces/audit-logs.repository.interface';
import type { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @Inject('IAuditLogsRepository')
    private readonly auditLogsRepo: AuditLogsRepositoryInterface,
  ) {}

  async findAll(query: AuditLogQueryDto) {
    return this.auditLogsRepo.findAll({
      category: query.category,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
