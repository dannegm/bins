import { createAvatar } from '@dicebear/core';
import { rings } from '@dicebear/rings';

export const getAvatarUrl = uuid =>
    createAvatar(rings, { seed: uuid }).toDataUri();
