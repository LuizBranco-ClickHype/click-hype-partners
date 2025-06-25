import { Injectable } from '@nestjs/common';
import { MonitoringConfig } from '../../config/monitoring.config';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  constructor(private monitoringConfig: MonitoringConfig) {}

  async getMetrics(): Promise<string> {
    return this.monitoringConfig.getMetrics();
  }

  async getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected', // TODO: Implementar verificação real do banco
      memory: {
        used: Math.round((usedMemory / 1024 / 1024) * 100) / 100, // MB
        total: Math.round((totalMemory / 1024 / 1024) * 100) / 100, // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        usage: this.getCpuUsage(),
        cores: os.cpus().length,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      },
    };
  }

  async getSystemStats() {
    const memoryUsage = process.memoryUsage();

    return {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
        },
      },
      system: {
        totalMemory: Math.round((os.totalmem() / 1024 / 1024) * 100) / 100,
        freeMemory: Math.round((os.freemem() / 1024 / 1024) * 100) / 100,
        loadAverage: os.loadavg(),
        cpus: os.cpus().length,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
      },
      node: {
        version: process.version,
        versions: process.versions,
      },
    };
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.round((1 - totalIdle / totalTick) * 100);
  }
} 