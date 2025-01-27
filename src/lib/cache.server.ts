import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from '$env/static/private'
import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
import { config } from '$lib/config'
import { Redis } from '@upstash/redis'

const isDevelopment = process.env.NODE_ENV === 'development'

const redis = isDevelopment
  ? null
  : new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })

export const getCacheKey = (type: string, id: string | number) => `${PUBLIC_APPLICATION_NAME}:${type}:${id}`

export const invalidateCache = async (type: string, id: string | number) => {
  if (isDevelopment) return
  const cacheKey = getCacheKey(type, id)
  await redis!.del(cacheKey)
}

export const getFromCache = <T>(type: string, id: string | number): Promise<T | null> => {
  if (isDevelopment) return Promise.resolve(null)
  const cacheKey = getCacheKey(type, id)
  return redis!.get<T>(cacheKey)
}

export const setInCache = async <T>(type: string, id: string | number, data: T): Promise<void> => {
  if (
    isDevelopment ||
    data == null ||
    (typeof data === 'string' && data.length === 0) ||
    (Array.isArray(data) && data.length === 0)
  )
    return
  const cacheKey = getCacheKey(type, id)
  await redis!.set(cacheKey, JSON.stringify(data), { ex: config.cache.ttl })
}
