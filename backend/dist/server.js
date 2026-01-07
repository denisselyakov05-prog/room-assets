import { inspect } from 'node:util';
function describeError(err) {
    if (err instanceof Error) {
        const meta = {};
        const nodeErr = err;
        if (nodeErr.code !== undefined)
            meta.code = nodeErr.code;
        if (nodeErr.errno !== undefined)
            meta.errno = nodeErr.errno;
        if (nodeErr.syscall !== undefined)
            meta.syscall = nodeErr.syscall;
        if (nodeErr.path !== undefined)
            meta.path = nodeErr.path;
        if (nodeErr.cause !== undefined)
            meta.cause = nodeErr.cause;
        if (err instanceof AggregateError) {
            meta.errors = err.errors.map((item) => item instanceof Error ? { name: item.name, message: item.message, stack: item.stack } : item);
        }
        return { error: err, meta: Object.keys(meta).length ? meta : undefined };
    }
    const preview = inspect(err, { depth: 6 });
    return {
        error: new Error(`Non-Error thrown: ${preview}`),
        meta: { thrownType: typeof err, thrownPreview: preview }
    };
}
async function main() {
    let app;
    try {
        const { buildApp } = await import('./app.js');
        // Создаем и настраиваем экземпляр Fastify, подключая плагины и маршруты из app.ts.
        app = await buildApp();
        // Определяем параметры запуска HTTP-сервера. Переменные окружения позволяют менять их без перекомпиляции.
        const port = Number(process.env.PORT ?? 3000);
        const host = process.env.HOST ?? '0.0.0.0';
        let closing = false;
        // Функция корректного завершения работы приложения при получении сигнала ОС (Ctrl+C или остановка контейнера).
        const shutdown = async (reason, err) => {
            if (closing)
                return;
            closing = true;
            if (app) {
                if (err) {
                    const { error, meta } = describeError(err);
                    app.log.fatal({ err: error, meta }, `fatal: ${reason}`);
                }
                else
                    app.log.info({ reason }, 'Shutting down...');
                try {
                    // Fastify аккуратно завершает все активные запросы и вызывает onClose-хуки (например, отключает Prisma).
                    await app.close();
                }
                finally {
                    process.exit(err ? 1 : 0);
                }
            }
            else {
                if (err) {
                    const { error, meta } = describeError(err);
                    console.error(`fatal before app init: ${reason}`, error);
                    if (meta)
                        console.error('fatal details:', meta);
                }
                else {
                    console.error(`fatal before app init: ${reason}`);
                }
                process.exit(1);
            }
        };
        // Подписываемся на стандартные сигналы завершения процесса и вызываем graceful shutdown.
        process.once('SIGINT', () => void shutdown('SIGINT'));
        process.once('SIGTERM', () => void shutdown('SIGTERM'));
        process.once('unhandledRejection', (reason) => void shutdown('unhandledRejection', reason));
        process.once('uncaughtException', (error) => void shutdown('uncaughtException', error));
        // Запускаем HTTP-сервер. Fastify сам обработает входящие запросы и будет логировать события.
        await app.listen({ port, host });
    }
    catch (err) {
        const { error, meta } = describeError(err);
        console.error('Failed to start application:', error);
        if (meta)
            console.error('Error details:', meta);
        process.exit(1);
    }
}
void main();
