import type { StructuredError } from '../types';

const MAX_BODY = 500

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Turn long HTTP / OpenRouter error strings into a short UI message + optional technical dump.
 */
export function formatChatApiErrorForStructured(raw: string): StructuredError {
  const keepTechnical = raw.length > 180

  const http = raw.match(/^\[HTTP (\d{3})]\s*(.*)$/s)
  if (http) {
    const status = http[1]
    const rest = http[2].trim()

    if (status === '429') {
      return {
        errorType: 'api-error',
        shortMessage: 'Service is busy',
        message:
          'The AI provider is temporarily rate-limited. Please wait a few seconds and try again.',
        technicalDetails: keepTechnical ? raw : undefined,
      }
    }

    if (status === '402') {
      return {
        errorType: 'api-error',
        shortMessage: 'Insufficient credits',
        message: rest || 'Add credits to continue using Oyren AI chat.',
        technicalDetails: keepTechnical ? raw : undefined,
      }
    }

    if (status === '401' || status === '403') {
      return {
        errorType: 'api-error',
        shortMessage: 'Access denied',
        message: 'Your session may have expired. Sign in again and retry.',
        technicalDetails: keepTechnical ? raw : undefined,
      }
    }

    // Try to parse nested JSON (OpenRouter often returns JSON after a prefix)
    const jsonStart = rest.indexOf('{')
    if (jsonStart >= 0) {
      const slice = rest.slice(jsonStart)
      for (let len = slice.length; len > 0; len--) {
        const chunk = slice.slice(0, len)
        try {
          const parsed = JSON.parse(chunk) as { error?: { message?: string }; message?: string }
          const inner = parsed?.error?.message ?? parsed?.message
          if (typeof inner === 'string' && inner.trim()) {
            return {
              errorType: 'api-error',
              shortMessage: `Request failed (${status})`,
              message: oneLine(inner).slice(0, MAX_BODY),
              technicalDetails: keepTechnical ? raw : undefined,
            }
          }
          break
        } catch {
          /* try shorter slice for truncated JSON from upstream */
        }
      }
    }

    const summary = oneLine(rest).slice(0, MAX_BODY)
    return {
      errorType: 'api-error',
      shortMessage: `Request failed (${status})`,
      message: summary || 'Something went wrong. Please try again.',
      technicalDetails: keepTechnical ? raw : undefined,
    }
  }

  const summary = oneLine(raw).slice(0, MAX_BODY)
  return {
    errorType: 'api-error',
    shortMessage: 'Error',
    message: summary || 'Something went wrong. Please try again.',
    technicalDetails: raw.length > MAX_BODY ? raw : undefined,
  }
}
