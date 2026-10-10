"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const scans_1 = require("./routes/scans");
const health_1 = require("./routes/health");
const cyberlab_1 = require("./routes/cyberlab");
async function buildServer() {
    const fastify = (0, fastify_1.default)({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
        },
        bodyLimit: 1048576, // 1MB
    });
    // CORS
    await fastify.register(cors_1.default, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    // Rate Limiting
    await fastify.register(rate_limit_1.default, {
        max: 120,
        timeWindow: '1 minute',
    });
    // Swagger OpenAPI Docs
    await fastify.register(swagger_1.default, {
        swagger: {
            info: {
                title: 'DevSphere Security API',
                description: 'Next-Generation Automated Website Security Analysis & Intelligence API',
                version: '1.0.0',
            },
            host: 'localhost:4000',
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            tags: [
                { name: 'Scans', description: 'Website security scans and posture evaluations' },
                { name: 'Health', description: 'System health monitoring and worker status' },
            ],
        },
    });
    await fastify.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });
    // Register API Routes under /api/v1
    await fastify.register(scans_1.scanRoutes, { prefix: '/api/v1' });
    await fastify.register(health_1.healthRoutes, { prefix: '/api/v1' });
    await fastify.register(cyberlab_1.cyberLabRoutes, { prefix: '/api/v1' });
    // Root redirect to docs or health
    fastify.get('/', async (_req, reply) => {
        return reply.redirect('/docs');
    });
    return fastify;
}
