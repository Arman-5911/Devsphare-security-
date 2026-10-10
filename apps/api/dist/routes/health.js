"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const scan_queue_1 = require("../queue/scan-queue");
const scan_store_1 = require("../storage/scan-store");
async function healthRoutes(fastify, _opts) {
    fastify.get('/health', {
        schema: {
            description: 'System health check and worker telemetry',
            tags: ['Health'],
        },
    }, async (_req, reply) => {
        const queueStats = scan_queue_1.scanQueue.getStats();
        const totalScans = scan_store_1.scanStore.count();
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
