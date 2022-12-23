import { withMeta } from 'express-zod-api';
import * as shared from 'shared';

export const GuildZod = withMeta(shared.GuildZod).example({
    id: '915047329042434',
    name: 'My guild',
    owner: '914997903364096',
});

export const UserZod = withMeta(shared.PublicUserZod).example({
    username: 'tea',
    id: '915655285018624',
    discriminator: '1000',
});
