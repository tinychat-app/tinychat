import { getModelForClass, prop } from '@typegoose/typegoose';

export class Channel {
    @prop({ required: true, unique: true })
    id!: string;

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    guildId!: string;
}

export const ChannelModel = getModelForClass(Channel);
