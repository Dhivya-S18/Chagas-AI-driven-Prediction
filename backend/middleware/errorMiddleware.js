export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  let statusCode = error.statusCode || error.status || 500;
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.type === 'entity.parse.failed') {
    statusCode = 400;
  } else if (error.code === 11000) {
    statusCode = 409;
  }

  const message = error.code === 'JWT_SECRET_MISSING' || error.name === 'MLServiceError'
    ? error.message
    : statusCode < 500
      ? error.message || 'Request failed.'
      : 'Internal server error.';

  if (statusCode >= 500 && error.code !== 'JWT_SECRET_MISSING') {
    console.error('Request failed with an internal server error.');
  }

  res.status(statusCode).json({ message });
};

export const notFound = (req, res, next) => {
  res.status(404).json({ message: 'Route not found.' });
};
