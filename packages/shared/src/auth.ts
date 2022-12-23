import { User } from './models/user';

export function verifyTokenFactory(consumer: any, producer: any) {
    return async (token: string): Promise<{ user: User } | undefined> => {
        const promise = new Promise<{ user: User } | undefined>((resolve) => {
            consumer.subscribe(`auth-${token}`, async (message: string) => {
                const { valid, user } = JSON.parse(message);
                if (!valid) {
                    resolve(undefined);
                } else {
                    resolve({ user });
                }
            });
        });

        await producer.publish('auth', JSON.stringify({ token }));

        return await promise;
    };
}
