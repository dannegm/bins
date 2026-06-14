import { createAvatar } from '@dicebear/core';
import * as rings from '@dicebear/rings';

export const getAvatarUrl = uuid =>
    uuid ? createAvatar(rings, { seed: uuid }).toDataUri() : '';
