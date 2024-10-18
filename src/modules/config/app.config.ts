export default () => ({
  jwt: {
    secretAccess: process.env.JWT_ACCESS_SECRET || 'defaultSecret',
    secretRefresh: process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  sessionExpiryDays: parseInt(process.env.SESSION_EXPIRY_DAYS, 10) || 7,
  cookieOptions: {
    httpOnly: true,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
});
