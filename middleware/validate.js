export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({
        message: `Invalid ${firstIssue.path.slice(1).join(".") || "request"}: ${firstIssue.message}`,
        issues: result.error.issues,
      });
    }

    // Overwrite with the parsed (and coerced/defaulted) values
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;
    next();
  };
}