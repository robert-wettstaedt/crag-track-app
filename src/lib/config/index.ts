import { DATABASE_URL } from '$env/static/private'

export const config = {
  database: {
    url: DATABASE_URL,
    maxPoolSize: 10,
    connectionTimeout: 30000,
    debug: process.env.NODE_ENV === 'development',
  },
  files: {
    resizing: {
      thumbnail: {
        width: 350,
      },
    },
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  cache: {
    ttl: 1000 * 60 * 60, // 1 hour default TTL
    queryTTL: 1000 * 60 * 5, // 5 minutes for query results
    userTTL: 1000 * 60 * 30, // 30 minutes for user data
    fileTTL: 1000 * 60 * 60 * 24, // 24 hours for file data
  },
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'error' : 'info',
    format: process.env.NODE_ENV === 'development' ? 'pretty' : 'json',
  },
} as const

export type Config = typeof config
