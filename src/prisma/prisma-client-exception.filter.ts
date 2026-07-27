import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  override catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') || 'unknown';
        response.status(status).json({
          statusCode: status,
          message: `Unique constraint failed on the fields: (${target})`,
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        const cause = (exception.meta?.cause as string) || 'Record not found.';
        response.status(status).json({
          statusCode: status,
          message: cause,
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        const fieldName = (exception.meta?.field_name as string) || 'unknown';
        response.status(status).json({
          statusCode: status,
          message: `Foreign key constraint failed on the field: ${fieldName}`,
        });
        break;
      }
      default:
        // Fallback to default NestJS exception handler
        super.catch(exception, host);
        break;
    }
  }
}
