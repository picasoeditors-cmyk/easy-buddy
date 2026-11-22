export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const clamp = (value, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, value))

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const uid = () => Math.random().toString(36).slice(2, 10)

export const pick = (arr, seed = 0) => arr[Math.abs(Math.floor(seed)) % arr.length]

export const level = (v) => (v >= 67 ? 'high' : v >= 34 ? 'mid' : 'low')

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export const hashStr = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const stripEmoji = (s) =>
  s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,!?)])/g, '$1')
    .trim()

export const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const fmtPct = (v, digits = 0) => `${Number(v).toFixed(digits)}%`

export const lerp = (a, b, t) => a + (b - a) * t
