import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { scanQueue } from '../queue/scan-queue';
import { scanStore } from '../storage/scan-store';

export async function healthRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.get('/health', {
    schema: {
      description: 'System health check and worker telemetry',
      tags: ['Health'],
    },
  }, async (_req, reply) => {
    const queueStats = scanQueue.getStats();
    const totalScans = scanStore.count();

    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'devsphere-api',
      version: '1.0.0',
      uptimeSeconds: process.uptime(),
      memory: process.memoryUsage(),
      queue: queueStats,
      totalScansStored: totalScans,
    });
  });
}
