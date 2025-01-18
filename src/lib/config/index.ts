export const config = {
  database: {
    maxPoolSize: 10,
    connectionTimeout: 30000,
    debug: process.env.NODE_ENV === 'development',
  },
  files: {
    maxSize: {
      number: 50 * 1024 * 1024,
      human: '50MB',
    },
    folders: {
      topos: '/topos',
      userContent: '/user-content',
    },
    resizing: {
      thumbnail: {
        width: 350,
      },
    },
  },
  routes: {
    defaultName: '<no name>',
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 500 requests per windowMs
    },
  },
  cache: {
    ttl: 1000 * 60 * 60, // 1 hour default TTL
    queryTTL: 1000 * 60 * 5, // 5 minutes for query results
    userTTL: 1000 * 60 * 30, // 30 minutes for user data
    fileTTL: 1000 * 60 * 60 * 24, // 24 hours for file data
  },
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'error',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  },
} as const

export type Config = typeof config
