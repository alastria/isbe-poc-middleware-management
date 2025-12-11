import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt.verify.js';
import { getContainer, registerRequestAuth, setContainer } from '../../di.js';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    console.log('Start authentication...');

    try {
        const auth = req.header('authorization') ?? '';
        console.log('Authorization header:', auth);

        const [scheme, token] = auth.split(' ');

        // Verify Bearer scheme
        if (scheme !== 'Bearer') {
            return res.status(401).json({ error: 'Authorization scheme must be Bearer' });
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