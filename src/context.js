import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const createContext = async ({ req }) => {
  // Extract token from authorization header
  const authHeader = req.headers.authorization;
  let user = null;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      user = {
        id: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      // Invalid token - continue without user
      console.log('Invalid token:', error.message);
    }
  }

  return {
    user,
    req
  };
};
