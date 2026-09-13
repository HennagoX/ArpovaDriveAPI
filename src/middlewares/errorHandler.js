import { ZodError } from 'zod';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found.',
    path: req.originalUrl
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[API_ERROR]', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid data.',
      details: err.flatten()
    });
  }

  if (err?.code === '23505') {
    return res.status(409).json({
      error: 'This email is already registered.'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  return res.status(statusCode).json({
    error: message
  });
}
