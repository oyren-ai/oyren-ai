// UTF-8 safe base64 decode function
const base64UrlDecode = (str: string): string => {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' to make length multiple of 4
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert binary string to UTF-8
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode UTF-8 bytes to string
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
};

/**
 * Decodes a JWT token and returns its payload
 * @param token - JWT token string
 * @returns Decoded payload object
 * @throws Error if token format is invalid or decoding fails
 */
export const decodeJwtPayload = <T = Record<string, unknown>>(token: string): T => {
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const decodedPayload = base64UrlDecode(tokenParts[1]);
  return JSON.parse(decodedPayload) as T;
};

/**
 * Checks if a JWT token is expired
 * @param payload - Decoded JWT payload containing 'exp' field
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (payload: { exp?: number }): boolean => {
  if (!payload.exp) {
    return false;
  }
  const expired = payload.exp * 1000 < Date.now();
  if (expired) {
    console.warn('⚠️ Token expired');
  }
  return expired;
};