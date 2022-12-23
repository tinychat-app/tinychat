import { getModelForClass, prop } from '@typegoose/typegoose';
import { withMeta, z } from 'express-zod-api';

export const GuildZod = withMeta(
    z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(32),
        owner: z.string().min(1), // TODO: Id or PublicUserZod?
    })
).example({
    id: '915047329042434',
    name: 'My guild',
    owner: '914997903364096',
});

export class Guild {
    @prop({ required: true, unique: true })
    id!: string;

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    owner!: string;

    @prop({ required: true, default: [] as string[], type: () => [String] })
    members!: string[];
}

export const GuildModel = getModelForClass(Guild);
