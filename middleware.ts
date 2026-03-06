// middleware.ts

import { NextFunction, Request, Response } from 'express';

// Middleware to enforce a 1-hour trial period with subscription requirement
export function trialMiddleware(req: Request, res: Response, next: NextFunction) {
    const trialStartedAt = req.user?.trial_started_at; // Assuming the timestamp is stored in the user object
    const currentTime = new Date().getTime();

    if (trialStartedAt) {
        const trialExpiry = new Date(trialStartedAt).
            setHours(new Date(trialStartedAt).getHours() + 1);

        // Check if the trial has expired
        if (currentTime > trialExpiry) {
            // Check if the user has an active subscription
            if (!req.user?.subscription_active) {
                return res.status(403).send('Trial has expired and no active subscription.');
            }
        }
    }

    next(); // Proceed to the next middleware / route handler
}