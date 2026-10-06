const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate the user using a JWT.
const protect = async (req, res, next) => {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
return res.status(401).json({
message: 'Not authorized, no token provided'
});
}

const token = authHeader.slice(7).trim();

if (!token) {
return res.status(401).json({
message: 'Not authorized, no token provided'
});
}

if (!process.env.JWT_SECRET) {
console.error('JWT_SECRET is not configured');

```
return res.status(500).json({
  message: 'Server authentication configuration error'
});
```

}

try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);

```
if (!decoded.id) {
  return res.status(401).json({
    message: 'Not authorized, invalid token'
  });
}

const user = await User.findById(decoded.id);

if (!user || user.isActive === false) {
  return res.status(401).json({
    message: 'Not authorized, user not found or inactive'
  });
}

req.user = user;

return next();
```

} catch (error) {
if (
error.name === 'JsonWebTokenError' ||
error.name === 'TokenExpiredError' ||
error.name === 'NotBeforeError'
) {
return res.status(401).json({
message: 'Not authorized, invalid or expired token'
});
}

```
return next(error);
```

}
};

// Allow only administrators.
const admin = (req, res, next) => {
if (!req.user) {
return res.status(401).json({
message: 'Not authorized, please log in'
});
}

if (req.user.role !== 'admin') {
return res.status(403).json({
message: 'Access denied. Administrator privileges required.'
});
}

return next();
};

module.exports = {
protect,
admin
};
