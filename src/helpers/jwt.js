import { SignJWT } from 'jose';

export const signJWT = async payload => {
    const secret = import.meta.env.VITE_SESSION_SECRET;
    const secretBytes = new TextEncoder().encode(secret);

    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretBytes);
};
