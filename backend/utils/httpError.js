// Small shared helpers so every admin route reports errors the same way.
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Wraps an async route handler so a thrown HttpError becomes the right response
// and any other error is logged and answered with a generic 500.
const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message, ...error.extra });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      return res.status(400).json({ message: `An entry with that ${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
    console.error('Admin route error:', error);
    res.status(500).json({ message: 'Something went wrong while processing your request' });
  }
};

module.exports = { HttpError, handle };