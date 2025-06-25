import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringConfig } from '../config/monitoring.config';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  constructor(private monitoringConfig: MonitoringConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capturar informações da requisição
    const method = req.method;
    const route = req.route?.path || req.path;

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = res.statusCode;

      // Registrar métricas
      this.monitoringConfig.incrementHttpRequests(method, route, statusCode);
      this.monitoringConfig.observeHttpDuration(method, route, statusCode, duration);
    });

    next();
  }
} 