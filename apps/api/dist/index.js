"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
async function main() {
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';
    try {
        const server = await (0, server_1.buildServer)();
        await server.listen({ port, host });
        console.log(`\n======================================================`);
        console.log(` DevSphere Security API running at http://${host}:${port}`);
        console.log(` Interactive Swagger Docs: http://${host}:${port}/docs`);
        console.log(`======================================================\n`);
    }
    catch (err) {
        console.error('Fatal error starting DevSphere API:', err);
        process.exit(1);
    }
}
main();
