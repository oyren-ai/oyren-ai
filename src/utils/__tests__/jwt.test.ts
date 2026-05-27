import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decodeJwtPayload, isTokenExpired } from '../jwt';

describe('JWT Utils', () => {
  describe('decodeJwtPayload', () => {
    it('should decode a valid JWT token', () => {
      // Sample JWT token (header.payload.signature)
      // Payload: {"sub":"123","email":"test@example.com","name":"Test User","exp":9999999999}
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';

      const payload = decodeJwtPayload(token);

      expect(payload).toEqual({
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
        exp: 9999999999,
      });
    });

    it('should throw error for invalid JWT format', () => {
      const invalidToken = 'invalid.token';

      expect(() => decodeJwtPayload(invalidToken)).toThrow('Invalid JWT format');
    });

    it('should decode JWT with UTF-8 characters', () => {
      // Token with UTF-8 characters in payload (name: "Tëst Üsér")
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVMOrc3Qgw5xzw6lyIn0.signature';

      const payload = decodeJwtPayload<{ sub: string; name: string }>(token);

      expect(payload.name).toBe('Tëst Üsér');
    });
  });

  describe('isTokenExpired', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should return false for non-expired token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTimestamp };

      expect(isTokenExpired(payload)).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return true and log warning for expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTimestamp };

      expect(isTokenExpired(payload)).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Token expired');
    });

    it('should return false when exp is not present', () => {
      const payload = {};

      expect(isTokenExpired(payload)).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});