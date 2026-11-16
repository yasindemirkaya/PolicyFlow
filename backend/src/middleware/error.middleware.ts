
import { ErrorRequestHandler } from "express";

const errorHandlerMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    path: req.originalUrl
  });
};

export default errorHandlerMiddleware;
