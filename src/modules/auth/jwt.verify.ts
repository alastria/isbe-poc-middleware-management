import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyOptions } from 'jose';
import { AUTH } from '../../settings.js';

const jwks = createRemoteJWKSet(new URL(AUTH.JWKS_URI));

export async function verifyAccessToken(token: string) {
  const opts: JWTVerifyOptions = { issuer: AUTH.ISSUER };
  // if (AUTH.AUDIENCE) opts.audience = AUTH.AUDIENCE; // TODO: validate audience

  try {
    const { payload } = await jwtVerify(token, jwks, opts);
    return payload as JWTPayload & AuthZContext;
  } catch (error) {
    console.log(error);

    throw error;
  }
}

export type AuthZContext = {
  company_id: string;
  user_id: string;
  role: string;
};
