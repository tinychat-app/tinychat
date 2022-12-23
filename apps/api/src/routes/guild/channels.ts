import { createHttpError, defaultEndpointsFactory, withMeta, z } from 'express-zod-api';
import { ChannelModel, GuildModel, InviteModel } from 'shared';

import { AuthenticatedOptions, client, snowflake, verifyAuthMiddleware } from '../../common';

export const createGuildChannel = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'post',
    description: 'Create a new channel',
    input: withMeta(
        z.object({
            name: z.string().min(1).max(32),
            id: z.string().min(1),
        })
    ).example({ name: 'My Channel', id: '915047329042434' }),
    output: z.object({
        id: z.string(),
        name: z.string(),
    }),
    handler: async ({ input: { name, id }, options }) => {
        const { user } = options as AuthenticatedOptions;
        const guild = await GuildModel.findOne({
            id: id,
            owner: user.id,
        });
        if (!guild) {
            throw createHttpError(404, 'Guild not found');
        }

        const channel = await ChannelModel.create({
            id: snowflake.generate().toString(),
            name,
            guildId: id,
        });

        client.publish(
            'gateway',
            JSON.stringify({
                type: 'dispatch',
                data: {
                    type: 'channel_create',
                    id: user.id,
                    channel: channel,
                },
            })
        );

        return channel;
    },
});

export const getGuildChannels = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'get',
    description: 'Get all channels in a guild',
    input: z.object({
        id: z.string().min(1),
    }),
    output: z.object({
        channels: z
            .object({
                id: z.string().min(1),
                name: z.string().min(1),
            })
            .array(),
    }),
    handler: async ({ input: { id }, options }) => {
        const { user } = options as AuthenticatedOptions;
        const guild = await GuildModel.findOne({
            id: id,
            owner: user.id,
        });
        if (!guild) {
            throw createHttpError(404, 'Guild not found');
        }
        const channels = await ChannelModel.find({
            guildId: id,
        });
        return { channels };
    },
});

export const createInvite = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'post',
    description: 'Create a new invite',
    input: withMeta(
        z.object({
            id: z.string().min(1),
            channelId: z.string().min(1),
        })
    ).example({ id: '915047329042434', channelId: '915047329042434' }),
    output: z.object({
        id: z.string(),
    }),
    handler: async ({ input: { id, channelId } }) => {
        const channel = await ChannelModel.findOne({
            id: channelId,
            guildId: id,
        });

        if (!channel) {
            throw createHttpError(404, 'Channel not found');
        }

        const invite = await InviteModel.create({
            id: snowflake.generate().toString(),
            guildId: id,
        });

        return { id: invite.id };
    },
});

export const useInvite = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'post',
    description: 'Use an invite',
    input: withMeta(
        z.object({
            id: z.string().min(1),
        })
    ).example({ id: '915047329042434' }),
    output: z.object({
        id: z.string(),
    }),
    handler: async ({ input: { id }, options }) => {
        const { user } = options as AuthenticatedOptions;
        const invite = await InviteModel.findOne({
            id: id,
        });

        if (!invite) {
            throw createHttpError(404, 'Invite not found');
        }

        // Check if the user is already member in the guild
        const guild = await GuildModel.findOne({
            id: invite.guildId,
            members: user.id,
        });
        if (guild) {
            throw createHttpError(403, 'User is already member of the guild');
        }

        await GuildModel.findOneAndUpdate(
            {
                id: invite.guildId,
            },
            {
                $push: {
                    members: user.id,
                },
            }
        );

        return { id: invite.id };
    },
});
