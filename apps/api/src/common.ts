import { Snowflake } from '@sapphire/snowflake';
import { createHttpError, createMiddleware, z } from 'express-zod-api';
import { createClient } from 'redis';
import { User, verifyTokenFactory } from 'shared';

export const tinyEpoch = new Date('2022-07-24T00:00:00.000Z');
export const snowflake = new Snowflake(tinyEpoch);

export const client = createClient({ url: process.env.TINYCHAT_REDIS_URI });
export const producer = client.duplicate();
export const consumer = client.duplicate();

export const verifyToken = verifyTokenFactory(consumer, producer);

export const verifyAuthMiddleware = createMiddleware({
    input: z.object({}),
    security: {
        and: [
            {
                type: 'bearer',
                format: 'jwt',
            },
        ],
    },
    middleware: async ({ request, logger }) => {
        if (request.headers.authorization === undefined) {
            logger.debug(`Rejecting request because no authorization header was provided`);
            throw createHttpError(401, 'Unauthorized');
        }
        const token = request.headers.authorization.split(' ')[1];
        const user = await verifyToken(token);
        if (!user) {
            logger.debug(`Rejecting request because token was invalid`);
            throw createHttpError(401, 'Unauthorized');
        }
        return user;
    },
});

export interface AuthenticatedOptions {
    user: User;
}
