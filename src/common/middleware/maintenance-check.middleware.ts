import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class MaintenanceCheckMiddleware implements NestMiddleware {
  use(_request: Request, response: Response, next: NextFunction): void {
    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

    if (environment === 'maintenance') {
      response.status(503).json({
        statusCode: 503,
        message:
          'Layanan sedang dalam pemeliharaan (Maintenance Mode). Silakan coba beberapa saat lagi.',
        error: 'Service Unavailable',
      });
      return;
    }

    next();
  }
}
