import { handleError } from '$lib/errors'
import { apiLogger } from '$lib/logging'
import { error, type Handle } from '@sveltejs/kit'

export const logger: Handle = async ({ event, resolve }) => {
  try {
    const start = Date.now()
    const response = await resolve(event)
    const duration = Date.now() - start

    apiLogger.info('Request completed', {
      method: event.request.method,
      path: event.url.pathname,
      status: response.status,
      duration,
    })

    return response
  } catch (err) {
    apiLogger.error('Request failed', {
      method: event.request.method,
      path: event.url.pathname,
      error: err,
    })

    const appError = handleError(err)

    throw error(appError.statusCode, {
      message: appError.message,
    })
  }
}
