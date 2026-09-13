import rateLimit from 'express-rate-limit';

export const rateLimiters = {
  general: rateLimit({
    windowMs: 14 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP. Please try again in 15 minutes.' },
    skip: (req) => req.method === 'OPTIONS'
  }),

  auth: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes.' },
    skip: (req) => req.method === 'OPTIONS'
  })
};
