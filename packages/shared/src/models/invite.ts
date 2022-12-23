import { getModelForClass, prop } from '@typegoose/typegoose';

export class Invite {
    @prop({ required: true, unique: true })
    id!: string;

    @prop({ required: true })
    channelId!: string;

    @prop({ required: true })
    guildId!: string;
}

export const InviteModel = getModelForClass(Invite);
