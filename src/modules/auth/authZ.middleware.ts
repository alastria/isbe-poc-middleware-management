import type { Request, Response, NextFunction } from 'express';
import { AUTH_TOKEN, getContainer } from '../../di.js';
import type { AuthZContext, Power } from './jwt.verify.js';

type PowerRequirement = {
    domain: string;         // e.g., "ISBE"
    function: string;       // e.g., "Faucet"
    type: string;       // e.g., "organization" or "domain" - accepts any of these types
    action: string[];       // e.g., ["read", "write"] - actions required
};

type Rule = {
    rolesAny?: string[];              // Legacy role-based auth
    requirePower?: PowerRequirement[];  // Single power requirement
};

/**
 * Check if user has the required actions in their powers
 * @param userPowers - Array of power objects from the token
 * @param requirement - Single power requirement to check
 * @returns true if user has all required actions for this requirement
 */
function matchesPowerRequirement(userPowers: Power[], requirement: PowerRequirement): boolean {
    // Find matching power by domain, function, and type
    const matchingPower = userPowers.find((power) => {
        const domainMatch = power.domain === requirement.domain;
        const functionMatch = power.function === requirement.function;
        const typeMatch = power.type === requirement.type;

        return domainMatch && functionMatch && typeMatch;
    });

    if (!matchingPower) {
        return false;
    }

    // If power has "*", it grants all actions
    if (matchingPower.action.includes('*')) {
        return true;
    }

    // Check if all required actions are present in the power's actions
    return requirement.action.every((requiredAction) =>
        matchingPower.action.includes(requiredAction)
    );
}

/**
 * Check if user has at least one of the required power combinations
 * @param userPowers - Array of power objects from the token
 * @param requirements - Array of power requirements (user needs to match at least one)
 * @returns true if user matches at least one requirement
 */
function hasRequiredPower(userPowers: Power[], requirements: PowerRequirement[]): boolean {
    // Check if user matches at least one of the requirements
    return requirements.some((requirement) => matchesPowerRequirement(userPowers, requirement));
}

export function authorize(rule: Rule = {}) {
    const allowedRoles = (rule.rolesAny ?? []).map((r) => r.toUpperCase());
    const powerRequirement = rule.requirePower;

    return (_req: Request, res: Response, next: NextFunction) => {
        const di = getContainer();

        if (!di.isRegistered?.(AUTH_TOKEN, true)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const auth = di.resolve<AuthZContext>(AUTH_TOKEN);
        const userRole = String(auth.role ?? '').toUpperCase();
        const userPowers = auth.power ?? [];

        // Check role-based authorization (legacy support)
        if (allowedRoles.length > 0) {
            if (allowedRoles.includes(userRole)) {
                return next(); // Role matches, allow access
            }
            // If roles don't match and no power requirement, deny
            if (!powerRequirement) {
                return res.status(403).json({ error: 'Forbidden: insufficient role' });
            }
        }

        // Check power-based authorization
        if (powerRequirement) {
            if (!hasRequiredPower(userPowers, powerRequirement)) {
                return res.status(403).json({
                    error: 'Forbidden: missing required power',
                    required: "Not powers for this action"
                });
            }
        }

        return next();
    };
}