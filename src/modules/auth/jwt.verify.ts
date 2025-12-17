import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyOptions } from 'jose';
import { AUTH } from '../../settings.js';

const jwks = createRemoteJWKSet(new URL(AUTH.JWKS_URI));
console.log('JWKS URI:', AUTH.JWKS_URI);
export async function verifyAccessToken(token: string) {
    // const opts: JWTVerifyOptions = { issuer: AUTH.ISSUER };
    // // if (AUTH.AUDIENCE) opts.audience = AUTH.AUDIENCE; // TODO: validate audience

    try {
        const { payload } = await jwtVerify(token, jwks);
        return payload as JWTPayload & AuthZContext;
    } catch (error) {
        console.log(error);

        throw error;
    }
}

export type Power = {
    action: string[]; // ["*"] or ["read", "write", "delete"]
    domain: string;   // e.g., "ISBE"
    function: string; // e.g., "Faucet"
    type: string;     // e.g., "organization"
};

export type AuthZContext = {
    organization: string;
    organization_identifier: string;
    name: string;
    user_identifier: string;
    power: Power[]; // Array of power objects from the token
    role?: string;

};