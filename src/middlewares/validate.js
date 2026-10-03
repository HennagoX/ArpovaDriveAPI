export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const flattened = result.error.flatten();
      const firstField = Object.keys(flattened.fieldErrors || {})[0];
      const firstFieldError = firstField ? flattened.fieldErrors[firstField]?.[0] : null;
      const errorMessage = firstFieldError || flattened.formErrors?.[0] || 'Dados inválidos.';

      return res.status(400).json({
        error: errorMessage,
        details: flattened
      });
    }

    req.validated = result.data;
    next();
  };
}