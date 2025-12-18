import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt.verify.js';
import { getContainer, registerRequestAuth, setContainer } from '../../di.js';
import { AUTH } from '../../settings.js';

/**
 * Validates API Key authentication
 */
function validateApiKey(apiKey: string): boolean {
    return AUTH.API_KEYS.length > 0 && AUTH.API_KEYS.includes(apiKey);
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    console.log('Start authentication...');

    try {
        const auth = req.header('authorization') ?? '';
        const apiKey = req.header('x-api-key');
        console.log('Authorization header:', auth);
        console.log('API Key present:', !!apiKey);

        // Check for API Key authentication first
        if (apiKey) {
            if (!validateApiKey(apiKey)) {
                return res.status(401).json({ error: 'Invalid API Key' });
            }

            console.log('Authenticated via API Key');

            // For API Key auth, create a basic context without organization info
            const parent = getContainer();
            const child = parent.createChildContainer();
            setContainer(child);
            registerRequestAuth(child, {
                organization: 'api-key-client',
                organization_identifier: 'api-key-client',
                name: 'API Key Client',
                user_identifier: 'api-key',
                power: [{
                    domain: 'ISBE',
                    function: 'Management',
                    type: 'domain',
                    action: ['*'],
                }], // API Keys have full access by default
                role: 'admin',
            });

            return next();
        }

        // Fall back to Bearer token authentication
        const [scheme, token] = auth.split(' ');

        // Verify Bearer scheme
        if (scheme !== 'Bearer') {
            return res.status(401).json({ error: 'Authorization scheme must be Bearer or provide X-API-Key header' });
        }

        if (!token) {
            return res.status(401).json({ error: 'Missing Bearer token' });
        }

        const authZContext = await verifyAccessToken(token);
        console.log('Authenticated user:', authZContext);

        const parent = getContainer();
        const child = parent.createChildContainer();
        setContainer(child);
        registerRequestAuth(child, {
            organization: authZContext.organization,
            organization_identifier: authZContext.organization_identifier,
            name: authZContext.name,
            user_identifier: authZContext.user_identifier,
            power: authZContext.power ?? [], // Pass power from token to context, default to empty array
            role: authZContext.role ?? '',
        });

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
}