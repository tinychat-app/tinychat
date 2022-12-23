import { createServer } from 'http';
import { createClient } from 'redis';
import { verifyTokenFactory } from 'shared';
import { WebSocket, WebSocketServer } from 'ws';
import { z } from 'zod';

const server = createServer();
const wss = new WebSocketServer({ server });

const init = z.object({
    token: z.string().min(1),
});
const producer = createClient({ url: process.env.TINYCHAT_REDIS_URI });
const consumer = producer.duplicate();

const verifyToken = verifyTokenFactory(consumer, producer);

type callbackType = (message: { type: string; data: any }) => any;
const listeners = new Map<string, callbackType[]>();

class GatewayWS {
    private socket: WebSocket;
    constructor(socket: WebSocket) {
        this.socket = socket;
    }
    send(op: string, data: any = undefined) {
        this.socket.send(JSON.stringify({ op, data }));
    }
}

wss.on('connection', (ws) => {
    let user: { token: string | null; id: string | null } | null = null;
    const gatewayWS = new GatewayWS(ws);

    gatewayWS.send('hello');
    ws.on('message', async (message) => {
        let rawMessage;

        try {
            rawMessage = JSON.parse(message.toString());
            if (typeof rawMessage !== 'object') throw new Error('Invalid message');
        } catch {
            return gatewayWS.send('error', {
                fatal: false,
                message: 'Sent undecodable message',
            });
        }

        if (typeof user?.id !== 'string') {
            if (rawMessage.op !== 'init') {
                return gatewayWS.send('error', {
                    fatal: false,
                    message: 'Sent message before ready',
                });
            }

            const payload = init.safeParse(rawMessage);
            if (!payload.success) {
                return gatewayWS.send('error', {
                    fatal: false,
                    message: 'Sent invalid init payload',
                });
            }
            user = { token: payload.data.token, id: null };

            const maybeUser = await verifyToken(payload.data.token);

            if (!maybeUser) {
                return gatewayWS.send('error', {
                    fatal: true,
                    message: 'Invalid token',
                });
            }

            user.id = maybeUser.user.id;
            gatewayWS.send('ready', {
                user: {
                    id: maybeUser.user.id,
                    username: maybeUser.user.username,
                    discriminator: maybeUser.user.discriminator,
                    email: maybeUser.user.email,
                },
            });

            // Only one connection to be authenticated at a time
            listeners.set(maybeUser.user.id, [
                (message) => {
                    if (message.type === 'disconnect') {
                        return ws.close();
                    } else if (message.type === 'dispatch') {
                        gatewayWS.send('dispatch', message.data);
                    }
                },
            ]);
        } else {
            gatewayWS.send('error', {
                fatal: false,
                message: 'Invalid message sent',
            });
        }

        if (ws.readyState !== ws.OPEN) return;
    });
});

const main = async () => {
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe('gateway', (rawMessage) => {
        const message: { type: 'internal' | 'confirm_auth' | 'dispatch' | string; data: any } = JSON.parse(rawMessage);
        if (message.type === 'internal') {
            if (message.data.cause === 'disconnect') {
                const callbacks = listeners.get(message.data.id);
                if (callbacks) {
                    for (const callback of callbacks) {
                        callback({ type: 'disconnect', data: {} });
                    }
                }
            }
        } else if (message.type === 'dispatch') {
            const callbacks = listeners.get(message.data.id);
            if (callbacks) {
                for (const callback of callbacks) {
                    callback(message);
                }
            }
        }
    });
    server.listen(8080, '0.0.0.0').addListener('listening', () => console.log('Listening localhost:8080'));
};
main();
