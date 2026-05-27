// Global test mock types
import { vi } from 'vitest'

declare global {
  var mockInvoke: typeof vi.fn
  var mockOpen: typeof vi.fn
}