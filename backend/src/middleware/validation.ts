import { Request, Response, NextFunction } from "express";
import { validate, formatValidationErrors } from "../utils/validators";
import Joi from "joi";

/**
 * Validation middleware factory
 * @param schema Joi schema
 * @param source Where to validate from: 'body', 'params', 'query'
 */
export function validateRequest(
  schema: Joi.Schema,
  source: "body" | "params" | "query" = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const { error, value } = validate(schema, data);

    if (error) {
      const formattedErrors = formatValidationErrors(error);
      return res.status(400).json({
        error: "Validation failed",
        details: formattedErrors,
      });
    }

    // Replace with validated data
    req[source] = value;
    next();
  };
}
