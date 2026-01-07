import fp from 'fastify-plugin';
import { PrismaClient } from '../generated/prisma/client.js';
// Fastify-плагин, который создаёт один экземпляр PrismaClient и подключает его ко всему приложению.
export default fp(async (app) => {
    const prisma = new PrismaClient();
    // decorate делает prisma доступным как app.prisma во всех маршрутах и хукax.
    app.decorate('prisma', prisma);
    // Хук onClose вызывает $disconnect, когда сервер останавливается, чтобы закрыть соединение с БД.
    app.addHook('onClose', async (inst) => {
        await inst.prisma.$disconnect();
    });
});
