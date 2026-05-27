export const authTestData = {
  validUser: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature',
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  },

  invalidTokens: {
    expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNjA5NDQ0ODAwfQ.signature',
    malformed: 'invalid.jwt.token',
    empty: ''
  }
};

export const authResponses = {
  loginSuccess: {
    token: 'mock-jwt-token',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    refreshTokenLifeTime: 3600,
  },

  refreshTokenSuccess: {
    token: 'mock-refreshed-jwt-token',
    refreshTokenLifeTime: 3600,
  },

  loginError: {
    error: 'Invalid credentials',
    status: 401
  }
};




