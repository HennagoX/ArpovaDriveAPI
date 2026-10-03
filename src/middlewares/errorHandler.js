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
    const flattened = err.flatten();
    const firstField = Object.keys(flattened.fieldErrors || {})[0];
    const firstFieldError = firstField ? flattened.fieldErrors[firstField]?.[0] : null;
    const errorMessage = firstFieldError || flattened.formErrors?.[0] || 'Dados inválidos.';

    return res.status(400).json({
      error: errorMessage,
      details: flattened
    });
  }

  if (err?.code === '23505') {
    return res.status(409).json({
      error: 'Esse e-mail já está em uso!'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  return res.status(statusCode).json({
    error: message
  });
}
