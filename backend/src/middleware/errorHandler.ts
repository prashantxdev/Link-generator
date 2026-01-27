import { Request, Response, NextFunction } from "express";

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("Error:", err);

  // Handle validation errors
  if (err.validation) {
    return res.status(400).json({
      error: "Validation error",
      details: err.validation,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  // Handle duplicate key errors
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Resource already exists",
    });
  }

  // Handle not found errors
  if (err.code === "23503") {
    return res.status(404).json({
      error: "Related resource not found",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
}

/**
 * Not found middleware
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
}
