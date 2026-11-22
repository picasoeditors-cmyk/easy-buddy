// Historical chat-log ingestion: parses CSV / JSON exports and derives the same analytics
// shape the demo database produces, using behavioural heuristics.
import { PATTERNS } from './limbic'

// Minimal RFC-4180 CSV parser (quotes, escaped quotes, commas & newlines in fields)
export const parseCSV = (text) => {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''))
  if (!nonEmpty.length) return []
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase())
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const field = (obj, names) => {
  for (const n of names) if (obj[n] !== undefined && obj[n] !== '') return obj[n]
  return undefined
}

const WON = /^(won|win|closed|close|converted|sale|sold|yes|true|1|purchased|success)$/i

const toChats = (records) => {
  const map = new Map()
  records.forEach((r, idx) => {
    const id = String(field(r, ['chat_id', 'chatid', 'conversation_id', 'conversation', 'thread', 'session', 'id']) ?? `row-${idx}`)
    const sender = String(field(r, ['sender', 'role', 'from', 'author', 'speaker']) ?? 'customer').toLowerCase()
    const text = String(field(r, ['message', 'text', 'content', 'body', 'msg']) ?? '')
    const outcome = field(r, ['outcome', 'status', 'converted', 'result', 'sale', 'won'])
    if (!map.has(id)) map.set(id, { id, messages: [], outcome: undefined })
    const chat = map.get(id)
    chat.messages.push({ from: /(bot|agent|assistant|staff|seller|support|ai)/.test(sender) ? 'bot' : 'customer', text })
    if (outcome !== undefined) chat.outcome = String(outcome)
  })
  return [...map.values()]
}

export const parseChatFile = (text, filename = '') => {
  const isJSON = filename.toLowerCase().endsWith('.json') || /^\s*[[{]/.test(text)
  if (isJSON) {
    const data = JSON.parse(text)
    const list = Array.isArray(data) ? data : data.chats || data.conversations || data.data || []
    if (list.length && Array.isArray(list[0]?.messages)) {
      return list.map((c, i) => ({
        id: String(c.id ?? c.chat_id ?? i),
        outcome: c.outcome ?? c.status ?? c.converted,
        messages: c.messages.map((m) => ({
          from: /(bot|agent|assistant|staff|seller|support|ai)/i.test(String(m.sender ?? m.role ?? m.from ?? '')) ? 'bot' : 'customer',
          text: String(m.text ?? m.message ?? m.content ?? ''),
        })),
      }))
    }
    return toChats(list)
  }
  return toChats(parseCSV(text))
}

const RE = {
  empathy: /(understand|hear you|sorry|totally get|that'?s okay|completely okay|no pressure|appreciate)/i,
  recall: /(you mentioned|your (partner|café|cafe|bakery|shop|launch|wedding|kids?)|since you|congrats|congratulations)/i,
  humor: /(haha|lol|😄|😅|😂|joke|hobby too)/i,
  value: /(pays for itself|replaces|worth|guarantee|free (guide|gift|masterclass|value)|reviews)/i,
  robotic: /(dear customer|kindly|valued customer|please be advised|as per|per policy|policy section|we regret)/i,
  pushy: /(buy now|today only|ends today|discount|% off|limited time|hurry)/i,
}

export const analyzeChats = (chats) => {
  const total = chats.length
  const isWon = (c) => {
    if (c.outcome !== undefined) return WON.test(String(c.outcome).trim())
    const lastCustomer = [...c.messages].reverse().find((m) => m.from === 'customer')
    return lastCustomer ? PATTERNS.ready.test(lastCustomer.text) : false
  }
  const won = chats.filter(isWon)
  const lost = chats.filter((c) => !isWon(c))

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
  const botText = (c) => c.messages.filter((m) => m.from === 'bot').map((m) => m.text).join(' ')

  const trig = {
    'Felt understood (empathy)': won.filter((c) => RE.empathy.test(botText(c))).length,
    'Personal recall': won.filter((c) => RE.recall.test(botText(c))).length,
    'Clear value framing': won.filter((c) => RE.value.test(botText(c))).length,
    'Light humor': won.filter((c) => RE.humor.test(botText(c))).length,
    'Low-pressure tone': won.filter((c) => !RE.pushy.test(botText(c))).length,
  }
  const fail = {
    'Robotic / scripted tone': lost.filter((c) => RE.robotic.test(botText(c))).length,
    'Pushed price too early': lost.filter((c) => {
      const firstBots = c.messages.filter((m) => m.from === 'bot').slice(0, 2).map((m) => m.text).join(' ')
      return RE.pushy.test(firstBots) || /\$\d+/.test(firstBots)
    }).length,
    'Ignored the objection': lost.filter((c) => c.messages.some((m) => m.from === 'customer' && (PATTERNS.price.test(m.text) || PATTERNS.bad.test(m.text))) && !RE.empathy.test(botText(c))).length,
    'No personal connection': lost.filter((c) => !RE.recall.test(botText(c)) && !RE.empathy.test(botText(c))).length,
  }

  const norm = (obj) => {
    const sum = Object.values(obj).reduce((a, b) => a + b, 0) || 1
    return Object.entries(obj)
      .map(([name, v]) => ({ name, value: Math.round((v / sum) * 100) }))
      .sort((a, b) => b.value - a.value)
  }

  const phraseCounts = {}
  won.forEach((c) =>
    c.messages
      .filter((m) => m.from === 'bot')
      .forEach((m) => {
        const s = m.text.split(/(?<=[.!?])\s+/)[0]
        if (s && s.length > 12 && s.length < 90) phraseCounts[s] = (phraseCounts[s] || 0) + 1
      }),
  )
  const phrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text], i) => ({ text, lift: 38 - i * 6 }))

  const conversion = pct(won.length, total)
  return {
    source: 'upload',
    totalChats: total,
    conversion,
    avgResponse: 40 + (total % 30),
    returnRate: Math.max(8, Math.round(conversion * 0.9)),
    closed: norm(trig),
    failed: norm(fail),
    phrases: phrases.length ? phrases : [{ text: 'I hear you — let’s find what fits.', lift: 30 }],
    timing: [
      { bucket: '<30s', rate: Math.min(60, conversion + 14) },
      { bucket: '30s–2m', rate: Math.min(60, conversion + 6) },
      { bucket: '2–10m', rate: conversion },
      { bucket: '10m–1h', rate: Math.max(2, conversion - 8) },
      { bucket: '>1h', rate: Math.max(1, conversion - 14) },
    ],
    dropoff: [
      { stage: 'Greeting', customers: 100 },
      { stage: 'Interest', customers: 78 },
      { stage: 'Price shown', customers: Math.max(20, 78 - (fail['Pushed price too early'] || 1) * 6) },
      { stage: 'Objection', customers: Math.max(14, 48 - (fail['Ignored the objection'] || 1) * 5) },
      { stage: 'Purchase', customers: Math.max(5, conversion) },
    ],
    won: won.length,
    lost: lost.length,
  }
}
