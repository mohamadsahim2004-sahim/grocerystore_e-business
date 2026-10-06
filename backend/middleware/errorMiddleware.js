const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Handle express / body-parser payload errors
  if (err.type && Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    statusCode = err.status;
    message =
      err.type === 'entity.parse.failed'
        ? 'Request body is not valid JSON'
        : err.type === 'entity.too.large'
        ? 'Request body is too large'
        : 'Invalid request';
  }

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An entry with that ${field} already exists`;
  }

  // Log 500+ errors and mask internal details in production
  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
    if (process.env.NODE_ENV !== 'development') {
      message = 'Something went wrong. Please try again later.';
    }
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = { notFound, errorHandler };