import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/auth.js';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  let secret;

  try {
    secret = getJwtSecret();
  } catch (error) {
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    req.user = { ...decoded, userId };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
