import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import type { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepo: AuditLogsRepository) {}

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
