import { isHttpError } from '@sveltejs/kit'

export const convertException = (exception: unknown): string => {
  if (isHttpError(exception)) {
    return exception.body.message
  }

  if (exception instanceof Error) {
    return exception.message
  }

  return String(exception)
}
