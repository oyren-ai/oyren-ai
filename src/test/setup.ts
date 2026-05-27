import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock lucide-react icons
import React from 'react'

vi.mock('lucide-react', () => ({
  Send: () => React.createElement('svg', { 'data-testid': 'icon-send' }),
  ChevronLeft: () => React.createElement('svg', { 'data-testid': 'icon-chevron-left' }),
  ChevronRight: () => React.createElement('svg', { 'data-testid': 'icon-chevron-right' }),
  Plus: () => React.createElement('svg', { 'data-testid': 'icon-plus' }),
  Search: () => React.createElement('svg', { 'data-testid': 'icon-search' }),
  X: () => React.createElement('svg', { 'data-testid': 'icon-x' }),
  ChevronDown: () => React.createElement('svg', { 'data-testid': 'icon-chevron-down' }),
  ChevronUp: () => React.createElement('svg', { 'data-testid': 'icon-chevron-up' }),
  Check: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
  Calendar: () => React.createElement('svg', { 'data-testid': 'icon-calendar' }),
  ArrowLeft: () => React.createElement('svg', { 'data-testid': 'icon-arrow-left' }),
  MoreVertical: () => React.createElement('svg', { 'data-testid': 'icon-more-vertical' }),
  Edit2: () => React.createElement('svg', { 'data-testid': 'icon-edit2' }),
  Trash2: () => React.createElement('svg', { 'data-testid': 'icon-trash2' }),
  AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert-triangle' }),
  Copy: () => React.createElement('svg', { 'data-testid': 'icon-copy' }),
  FileText: () => React.createElement('svg', { 'data-testid': 'icon-file-text' }),
  File: () => React.createElement('svg', { 'data-testid': 'icon-file' }),
  Folder: () => React.createElement('svg', { 'data-testid': 'icon-folder' }),
  FolderOpen: () => React.createElement('svg', { 'data-testid': 'icon-folder-open' }),
  Download: () => React.createElement('svg', { 'data-testid': 'icon-download' }),
  Upload: () => React.createElement('svg', { 'data-testid': 'icon-upload' }),
  Save: () => React.createElement('svg', { 'data-testid': 'icon-save' }),
  Sun: () => React.createElement('svg', { 'data-testid': 'icon-sun' }),
  Moon: () => React.createElement('svg', { 'data-testid': 'icon-moon' }),
  Settings: () => React.createElement('svg', { 'data-testid': 'icon-settings' }),
  MessageSquare: () => React.createElement('svg', { 'data-testid': 'icon-message-square' }),
  Highlighter: () => React.createElement('svg', { 'data-testid': 'icon-highlighter' }),
  StickyNote: () => React.createElement('svg', { 'data-testid': 'icon-sticky-note' }),
  Key: () => React.createElement('svg', { 'data-testid': 'icon-key' }),
  ExternalLink: () => React.createElement('svg', { 'data-testid': 'icon-external-link' }),
  Eye: () => React.createElement('svg', { 'data-testid': 'icon-eye' }),
  EyeOff: () => React.createElement('svg', { 'data-testid': 'icon-eye-off' }),
  Info: () => React.createElement('svg', { 'data-testid': 'icon-info' }),
  Image: () => React.createElement('svg', { 'data-testid': 'icon-image' }),
  ZoomIn: () => React.createElement('svg', { 'data-testid': 'icon-zoom-in' }),
  ZoomOut: () => React.createElement('svg', { 'data-testid': 'icon-zoom-out' }),
  RotateCw: () => React.createElement('svg', { 'data-testid': 'icon-rotate-cw' }),
  RefreshCw: () => React.createElement('svg', { 'data-testid': 'icon-refresh-cw' }),
  AlertCircle: () => React.createElement('svg', { 'data-testid': 'icon-alert-circle' }),
  Sparkles: () => React.createElement('svg', { 'data-testid': 'icon-sparkles' }),
  Bot: () => React.createElement('svg', { 'data-testid': 'icon-bot' }),
  Wand2: () => React.createElement('svg', { 'data-testid': 'icon-wand2' }),
  ArrowRight: () => React.createElement('svg', { 'data-testid': 'icon-arrow-right' }),
  Menu: () => React.createElement('svg', { 'data-testid': 'icon-menu' }),
  Home: () => React.createElement('svg', { 'data-testid': 'icon-home' }),
  ImageIcon: () => React.createElement('svg', { 'data-testid': 'icon-image-icon' }),
  Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
  History: () => React.createElement('svg', { 'data-testid': 'icon-history' }),
  Coins: () => React.createElement('svg', { 'data-testid': 'icon-coins' }),
  Square: () => React.createElement('svg', { 'data-testid': 'icon-square' }),
  MoreHorizontal: () => React.createElement('svg', { 'data-testid': 'icon-more-horizontal' }),
  Edit: () => React.createElement('svg', { 'data-testid': 'icon-edit' }),
  Trash: () => React.createElement('svg', { 'data-testid': 'icon-trash' }),
  PanelLeftIcon: () => React.createElement('svg', { 'data-testid': 'icon-panel-left' }),
  User: () => React.createElement('svg', { 'data-testid': 'icon-user' }),
  HelpCircle: () => React.createElement('svg', { 'data-testid': 'icon-help-circle' }),
  Zap: () => React.createElement('svg', { 'data-testid': 'icon-zap' }),
  Wifi: () => React.createElement('svg', { 'data-testid': 'icon-wifi' }),
  FileCode: () => React.createElement('svg', { 'data-testid': 'icon-file-code' }),
  Presentation: () => React.createElement('svg', { 'data-testid': 'icon-presentation' }),
  LogOut: () => React.createElement('svg', { 'data-testid': 'icon-logout' }),
  Mail: () => React.createElement('svg', { 'data-testid': 'icon-mail' }),
  Type: () => React.createElement('svg', { 'data-testid': 'icon-type' }),
  Cpu: () => React.createElement('svg', { 'data-testid': 'icon-cpu' }),
  Loader2: () => React.createElement('svg', { 'data-testid': 'icon-loader2' }),
  Bookmark: () => React.createElement('svg', { 'data-testid': 'icon-bookmark' }),
  Database: () => React.createElement('svg', { 'data-testid': 'icon-database' }),
  BookOpen: () => React.createElement('svg', { 'data-testid': 'icon-book-open' }),
  List: () => React.createElement('svg', { 'data-testid': 'icon-list' }),
  ClipboardCopy: () => React.createElement('svg', { 'data-testid': 'icon-clipboard-copy' }),
  Code: () => React.createElement('svg', { 'data-testid': 'icon-code' }),
  FileOutput: () => React.createElement('svg', { 'data-testid': 'icon-file-output' }),
  Blocks: () => React.createElement('svg', { 'data-testid': 'icon-blocks' }),
  Link: () => React.createElement('svg', { 'data-testid': 'icon-link' }),
  CloudUpload: () => React.createElement('svg', { 'data-testid': 'icon-cloud-upload' }),
  CheckCircle2: () => React.createElement('svg', { 'data-testid': 'icon-check-circle2' }),
  XCircle: () => React.createElement('svg', { 'data-testid': 'icon-x-circle' }),
  // Add other icons as needed
}))

// Mock Tauri APIs
const mockInvoke = vi.fn()
const mockOpen = vi.fn()
const mockListen = vi.fn((eventName: string, handler: (event: any) => void) => {
  // Return a promise that resolves to an unlisten function
  return Promise.resolve(() => {
    // Unlisten function (cleanup)
  });
})
const mockEmit = vi.fn(() => Promise.resolve())

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
  isTauri: vi.fn(() => false),
  convertFileSrc: vi.fn((filePath: string) => `asset://mock/${encodeURIComponent(filePath)}`),
}))

vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn(async (...segments: string[]) => segments.join('/').replace(/\/+/g, '/')),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
  emit: mockEmit,
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: mockOpen
}))

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
}))

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,mockImageData')
  }))
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()

// Mock window.open
const mockWindowOpen = vi.fn()
global.window.open = mockWindowOpen as any

// Mock window.getSelection
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    toString: vi.fn(() => ''),
    removeAllRanges: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Make mock functions available globally for tests
(global as any).mockInvoke = mockInvoke;
(global as any).mockOpen = mockOpen;
(global as any).mockListen = mockListen;
(global as any).mockEmit = mockEmit;
(global as any).mockWindowOpen = mockWindowOpen;

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock pointer capture APIs for Radix UI compatibility
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
}
if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = vi.fn()
}
if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = vi.fn()
}

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  configurable: true
})

// Mock localStorage
const localStorageData: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => localStorageData[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageData[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageData[key]
    }),
    clear: vi.fn(() => {
      Object.keys(localStorageData).forEach(key => delete localStorageData[key])
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(localStorageData)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(localStorageData).length
    }
  },
  configurable: true
})

// Polyfill window.matchMedia for jsdom
if (typeof window.matchMedia !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  // Clear localStorage data
  Object.keys(localStorageData).forEach(key => delete localStorageData[key])
})

// Use real timers by default
vi.useRealTimers()
