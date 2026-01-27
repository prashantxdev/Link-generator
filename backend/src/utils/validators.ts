import Joi from "joi";
import {
  CreateUserRequest,
  LoginRequest,
  CreateHubRequest,
  CreateLinkRequest,
  CreateRuleRequest,
} from "../types";

/**
 * User validation schemas
 */
export const userValidationSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
    }),
    full_name: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

/**
 * Hub validation schemas
 */
export const hubValidationSchemas = {
  create: Joi.object({
    title: Joi.string().max(255).required().messages({
      "string.max": "Title must be 255 characters or less",
      "any.required": "Title is required",
    }),
    description: Joi.string().optional(),
    theme: Joi.string().valid("green", "blue", "red").default("green"),
  }),

  update: Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().optional(),
    theme: Joi.string().valid("green", "blue", "red").optional(),
    is_active: Joi.boolean().optional(),
  }),
};

/**
 * Link validation schemas
 */
export const linkValidationSchemas = {
  create: Joi.object({
    title: Joi.string().max(255).required(),
    url: Joi.string().uri().required().messages({
      "string.uri": "Invalid URL format",
      "any.required": "URL is required",
    }),
    description: Joi.string().optional(),
    icon_url: Joi.string().uri().optional(),
  }),

  update: Joi.object({
    title: Joi.string().max(255).optional(),
    url: Joi.string().uri().optional(),
    description: Joi.string().optional(),
    icon_url: Joi.string().uri().optional(),
    display_order: Joi.number().integer().min(1).optional(),
    is_active: Joi.boolean().optional(),
  }),
};

/**
 * Rule validation schemas
 */
export const ruleValidationSchemas = {
  create: Joi.object({
    rule_type: Joi.string()
      .valid("time", "device", "location", "performance")
      .required(),
    rule_name: Joi.string().max(255).optional(),
    rule_config: Joi.object().required().messages({
      "any.required": "Rule configuration is required",
    }),
    priority: Joi.number().integer().default(0).optional(),
  }),

  update: Joi.object({
    rule_name: Joi.string().max(255).optional(),
    rule_config: Joi.object().optional(),
    priority: Joi.number().integer().optional(),
    is_active: Joi.boolean().optional(),
  }),
};

/**
 * Validation helper function
 * @param schema Joi schema
 * @param data Data to validate
 * @returns { value, error }
 */
export function validate(schema: Joi.Schema, data: any) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
}

/**
 * Format validation errors
 */
export function formatValidationErrors(
  error: Joi.ValidationError,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  error.details.forEach((detail) => {
    const key = detail.path.join(".");
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(detail.message);
  });
  return errors;
}
