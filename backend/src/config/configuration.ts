export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'disaster_relief_jwt_secret_default_key_2026',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '1h',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5500'],
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 120,
  },
  socket: {
    port: parseInt(process.env.SOCKET_PORT, 10) || 3000,
  },
  maps: {
    graphhopperApiKey: process.env.GRAPHHOPPER_API_KEY || '',
  },
});
