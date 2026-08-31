import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logPath = path.join(process.cwd(), 'logs', 'request.log');

  constructor() {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const responseTime = Date.now() - startTime;
      const message = `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }

      try {
        fs.appendFileSync(this.logPath, `${new Date().toISOString()} ${message}\n`);
      } catch {
        // Silently continue if log file write fails
      }
    });

    next();
  }
}
