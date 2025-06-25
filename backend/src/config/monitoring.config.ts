import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MonitoringConfig {
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private activeConnections: Gauge<string>;
  private databaseConnections: Gauge<string>;

  constructor(private configService: ConfigService) {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Coletar métricas padrão do Node.js
    collectDefaultMetrics({ register });

    // Contador de requisições HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    // Duração das requisições HTTP
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [register],
    });

    // Conexões ativas
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [register],
    });

    // Conexões de banco de dados
    this.databaseConnections = new Gauge({
      name: 'database_connections',
      help: 'Number of database connections',
      labelNames: ['status'],
      registers: [register],
    });
  }

  // Incrementar contador de requisições
  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  // Observar duração da requisição
  observeHttpDuration(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
      },
      duration
    );
  }

  // Definir número de conexões ativas
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Definir conexões de banco de dados
  setDatabaseConnections(status: 'active' | 'idle' | 'total', count: number) {
    this.databaseConnections.set({ status }, count);
  }

  // Obter registro de métricas
  getRegister() {
    return register;
  }

  // Obter métricas em formato Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Resetar métricas (útil para testes)
  clearMetrics() {
    register.clear();
    this.initializeMetrics();
  }
} 