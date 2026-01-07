import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { STATUS_CODES } from 'node:http';
import prismaPlugin from './plugins/prisma.js';
import { Type as T } from 'typebox';
import { Room, CreateRoom, UpdateRoom } from './types.js';
import { ValidationProblem, ProblemDetails, User, Health } from './types.js';
// Этот модуль собирает все настройки Fastify: плагины инфраструктуры, обработчики ошибок и маршруты API.
/**
 * Создает и настраивает экземпляр Fastify, готовый к запуску.
 */
function mapRoom(room) {
    return {
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString()
    };
}
export async function buildApp() {
    const app = Fastify({
        logger: true, // Подключаем встроенный логгер Fastify.
        trustProxy: true, // Разрешаем доверять заголовкам X-Forwarded-* от прокси/ingress.
        /**
         * Схема валидации TypeBox -> Fastify генерирует массив ошибок.
         * Мы превращаем его в ValidationProblem, чтобы вернуть клиенту единый формат Problem Details.
         */
        schemaErrorFormatter(errors, dataVar) {
            const msg = errors.map((e) => e.message).filter(Boolean).join('; ') || 'Validation failed';
            return new ValidationProblem(msg, errors, dataVar);
        }
    }).withTypeProvider(); // Позволяет Fastify понимать типы TypeBox при описании схем.
    // === Инфраструктурные плагины ===
    // Helmet добавляет безопасные HTTP-заголовки (Content-Security-Policy, X-DNS-Prefetch-Control и др.).
    await app.register(helmet);
    // CORS ограничивает кросс-доменные запросы. Здесь полностью запрещаем их (origin: false) по умолчанию.
    await app.register(cors, { origin: false });
    /**
     * Ограничитель количества запросов на IP.
     * Плагин автоматически вернет 429, а мы формируем Problem Details в errorResponseBuilder.
     */
    await app.register(rateLimit, {
        max: 100, // Максимум 100 запросов
        timeWindow: '1 minute', // За одну минуту
        enableDraftSpec: true, // Добавляет стандартные RateLimit-* заголовки в ответ
        addHeaders: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true,
            'retry-after': true
        },
        errorResponseBuilder(request, ctx) {
            const seconds = Math.ceil(ctx.ttl / 1000);
            return {
                type: 'about:blank',
                title: 'Too Many Requests',
                status: 429,
                detail: `Rate limit exceeded. Retry in ${seconds} seconds.`,
                instance: request.url
            };
        }
    });
    /**
     * Документация API в формате OpenAPI 3.0.
     */
    await app.register(swagger, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'Rooms API',
                version: '1.0.0',
                description: 'HTTP-API, совместим с RFC 9457.'
            },
            servers: [{ url: 'http://localhost:3000' }],
            tags: [
                { name: 'Users', description: 'Маршруты для управления пользователями' },
                { name: 'System', description: 'Служебные эндпоинты' }
            ]
        }
    });
    // Плагин с PrismaClient: открывает соединение с БД и добавляет app.prisma во все маршруты.
    await app.register(prismaPlugin);
    // === Глобальные обработчики ошибок ===
    /**
     * Единая точка обработки ошибок. Мы приводим их к Problem Details и отправляем клиенту JSON.
     * ValidationProblem превращается в 400, остальные ошибки хранят свой статус или получают 500.
     */
    app.setErrorHandler((err, req, reply) => {
        const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
        const isValidation = err instanceof ValidationProblem;
        const problem = {
            type: 'about:blank',
            title: STATUS_CODES[status] ?? 'Error',
            status,
            detail: err.message || 'Unexpected error',
            instance: req.url,
            ...(isValidation ? { errorsText: err.message } : {})
        };
        reply.code(status).type('application/problem+json').send(problem);
    });
    // Отдельный обработчик 404: отвечает в формате Problem Details.
    app.setNotFoundHandler((request, reply) => {
        reply.code(404).type('application/problem+json').send({
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            detail: `Route ${request.method} ${request.url} not found`,
            instance: request.url
        });
    });
    // === Маршруты API ===
    /**
     * GET /api/users — примеры чтения данных из базы через Prisma.
     */
    app.get('/api/users', {
        schema: {
            operationId: 'listUsers',
            tags: ['Users'],
            summary: 'Возвращает список пользователей',
            description: 'Получаем id и email для каждого пользователя.',
            response: {
                200: {
                    description: 'Список пользователей',
                    content: { 'application/json': { schema: T.Array(User) } }
                },
                429: {
                    description: 'Too Many Requests',
                    headers: {
                        'retry-after': {
                            schema: T.Integer({ minimum: 0, description: 'Через сколько секунд можно повторить запрос' })
                        }
                    },
                    content: { 'application/problem+json': { schema: ProblemDetails } }
                },
                500: {
                    description: 'Internal Server Error',
                    content: { 'application/problem+json': { schema: ProblemDetails } }
                }
            }
        }
    }, async (_req, _reply) => {
        // Prisma автоматически превращает результат в Promise; Fastify вернет массив как JSON.
        return app.prisma.user.findMany({ select: { id: true, email: true } });
    });
    app.get('/api/rooms', {
        schema: {
            operationId: 'listRooms',
            tags: ['Rooms'],
            summary: 'Список аудиторий',
            response: {
                200: {
                    content: { 'application/json': { schema: T.Array(Room) } }
                }
            }
        }
    }, async () => {
        const rooms = await app.prisma.room.findMany();
        return rooms.map(mapRoom);
    });
    app.get('/api/rooms/:id', {
        schema: {
            operationId: 'getRoom',
            tags: ['Rooms'],
            params: T.Object({
                id: T.String()
            }),
            response: {
                200: { content: { 'application/json': { schema: Room } } },
                404: { content: { 'application/problem+json': { schema: ProblemDetails } } }
            }
        }
    }, async (req, reply) => {
        const room = await app.prisma.room.findUnique({
            where: { id: req.params.id }
        });
        if (!room) {
            return reply.code(404).send({
                type: 'about:blank',
                title: 'Not Found',
                status: 404,
                detail: 'Room not found',
                instance: req.url
            });
        }
        return mapRoom(room);
    });
    app.post('/api/rooms', {
        schema: {
            operationId: 'createRoom',
            tags: ['Rooms'],
            body: CreateRoom,
            response: {
                201: { content: { 'application/json': { schema: Room } } }
            }
        }
    }, async (req, reply) => {
        const room = await app.prisma.room.create({
            data: req.body
        });
        return reply.code(201).send(mapRoom(room));
    });
    app.patch('/api/rooms/:id', {
        schema: {
            operationId: 'updateRoom',
            tags: ['Rooms'],
            params: T.Object({ id: T.String() }),
            body: UpdateRoom,
            response: {
                200: { content: { 'application/json': { schema: Room } } },
                404: { content: { 'application/problem+json': { schema: ProblemDetails } } }
            }
        }
    }, async (req, reply) => {
        try {
            const room = await app.prisma.room.update({
                where: { id: req.params.id },
                data: req.body
            });
            return mapRoom(room);
        }
        catch {
            return reply.code(404).send({
                type: 'about:blank',
                title: 'Not Found',
                status: 404,
                detail: 'Room not found',
                instance: req.url
            });
        }
    });
    app.delete('/api/rooms/:id', {
        schema: {
            operationId: 'deleteRoom',
            tags: ['Rooms'],
            params: T.Object({ id: T.String() }),
            response: {
                204: { description: 'Deleted' },
                404: { content: { 'application/problem+json': { schema: ProblemDetails } } }
            }
        }
    }, async (req, reply) => {
        try {
            await app.prisma.room.delete({
                where: { id: req.params.id }
            });
            return reply.code(204).send();
        }
        catch {
            return reply.code(404).send({
                type: 'about:blank',
                title: 'Not Found',
                status: 404,
                detail: 'Room not found',
                instance: req.url
            });
        }
    });
    /**
     * GET /api/health — health-check для мониторинга.
     * Пытаемся сделать минимальный запрос в БД. Если БД недоступна, возвращаем 503.
     */
    app.get('/api/health', {
        schema: {
            operationId: 'health',
            tags: ['System'],
            summary: 'Health/Readiness',
            description: 'Проверяет, что процесс жив и база данных отвечает.',
            response: {
                200: {
                    description: 'Ready',
                    content: { 'application/json': { schema: Health } }
                },
                503: {
                    description: 'Temporarily unavailable',
                    content: { 'application/problem+json': { schema: ProblemDetails } }
                },
                429: {
                    description: 'Too Many Requests',
                    headers: {
                        'retry-after': { schema: T.Integer({ minimum: 0 }) }
                    },
                    content: { 'application/problem+json': { schema: ProblemDetails } }
                },
                500: {
                    description: 'Internal Server Error',
                    content: { 'application/problem+json': { schema: ProblemDetails } }
                }
            }
        }
    }, async (_req, reply) => {
        try {
            // Если SELECT 1 прошел — сервис готов.
            await app.prisma.$queryRaw `SELECT 1`;
            return { ok: true };
        }
        catch {
            // Возвращаем 503, чтобы условный балансировщик мог вывести инстанс из ротации.
            reply.code(503).type('application/problem+json').send({
                type: 'https://example.com/problems/dependency-unavailable',
                title: 'Service Unavailable',
                status: 503,
                detail: 'Database ping failed',
                instance: '/api/health'
            });
        }
    });
    app.get('/', async (_req, reply) => {
        return reply.redirect('/openapi.json');
    });
    // Служебный маршрут: возвращает OpenAPI-спецификацию.
    app.get('/openapi.json', {
        schema: { hide: true, tags: ['Internal'] } // Скрыт из списка, но доступен для клиентов/тестов
    }, async (_req, reply) => {
        reply.type('application/json').send(app.swagger());
    });
    return app;
}
