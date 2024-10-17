export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  sessionExpiryDays: parseInt(process.env.SESSION_EXPIRY_DAYS, 10) || 7,
});
