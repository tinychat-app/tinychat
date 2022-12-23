import { getModelForClass, mongoose, prop } from '@typegoose/typegoose';
import { z } from 'zod';

export const PublicUserZod = z.object({
    username: z.string().min(1),
    discriminator: z.string().min(1),
    id: z.string().min(1),
});

// prettier-ignore
export const UserZod = z.object({
    email: z.string().min(1),
})
.merge(PublicUserZod)

export class User {
    @prop({ required: true, unique: true })
    id!: string;

    @prop({ required: true })
    username!: string;

    @prop({ required: true })
    discriminator!: string;

    @prop({ required: true })
    email!: string;

    @prop({ required: true })
    hash!: string;
}

export const UserModel = getModelForClass(User);
