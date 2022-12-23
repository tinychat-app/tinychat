import { mongoose } from '@typegoose/typegoose';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { User, UserModel } from 'shared';

export const verifyToken = async (token: string): Promise<{ user: User } | undefined> => {
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch {
        return;
    }
    if (decoded === null || typeof decoded != 'object' || typeof decoded.id !== 'string') {
        return;
    }

    const user = await UserModel.findOne({ id: decoded.id });
    if (!user) {
        return;
    }

    try {
        jwt.verify(token, user.hash);
    } catch (e) {
        return;
    }
    return { user };
};
const consumer = createClient();
const producer = consumer.duplicate();

async function main() {
    await mongoose.connect('mongodb://localhost:27017/dev');
    await producer.connect();
    await consumer.connect();

    consumer.subscribe('auth', async (message) => {
        const { token } = JSON.parse(message);

        let maybeUser: { user: any } | undefined;
        try {
            maybeUser = await verifyToken(token);
        } catch (e) {
            console.error(e);
            return;
        }
        if (!maybeUser || !maybeUser.user) {
            await producer.publish(
                `auth-${token}`,
                JSON.stringify({
                    valid: false,
                    user: null,
                })
            );
            return;
        }

        await producer.publish(
            `auth-${token}`,
            JSON.stringify({
                valid: true,
                user: maybeUser!.user,
            })
        );
    });

    console.log('Auth service started');

    await new Promise((resolve) => {
        consumer.on('end', resolve);
    });
}

main();
