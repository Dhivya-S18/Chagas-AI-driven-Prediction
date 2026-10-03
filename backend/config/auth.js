export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    const error = new Error('JWT_SECRET is required. Configure it in the backend environment.');
    error.code = 'JWT_SECRET_MISSING';
    throw error;
  }

  return secret;
};