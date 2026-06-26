const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretfixditjwtkey123!'
      );

      let user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      let sanitizedUser = user;
      if (typeof user.toObject === 'function') {
        sanitizedUser = user.toObject();
      } else {
        sanitizedUser = { ...user };
      }

      delete sanitizedUser.password;

      req.user = sanitizedUser;

      next();
    } catch (error) {
      console.error(`Auth Middleware error: ${error.message}`);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
