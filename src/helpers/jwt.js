import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(import.meta.env.VITE_SESSION_SECRET);

export const signJWT = async (payload, options = {}) => {
    let builder = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' });
    if (options.expiresIn) builder = builder.setExpirationTime(options.expiresIn);
    return builder.sign(getSecret());
};

export const verifyJWT = async token => {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
};
