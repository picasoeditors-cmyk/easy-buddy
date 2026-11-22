// Persona Studio live preview: the bot's reply to a fixed objection, recomposed on every slider change.
import { clamp, stripEmoji } from '../lib/utils'

export const PREVIEW_PROMPT = "This looks cool, but it's a bit out of my budget right now"

const band = (v, lo, hi) => (v < lo ? 0 : v < hi ? 1 : 2)

export const previewReply = (persona, b) => {
  const { empathy, humor, warmth, persistence } = persona
  const E = band(empathy, 34, 67)
  const H = band(humor, 40, 72)
  const W = band(warmth, 34, 67)
  const P = band(persistence, 38, 70)

  const openers = [
    ['Understood.', 'I understand.', 'Thanks for being upfront.'],
    ['I completely understand.', 'Totally fair — budgets are real.', 'Really appreciate you telling me that.'],
    [
      'I totally hear you — budgets are real, and I really appreciate you being honest with me.',
      'Thank you for sharing that, truly. Money decisions deserve care, not pressure.',
      'Honestly, thank you for trusting me with that 💛 Budgets are personal, and yours matters.',
    ],
  ]
  const opener = openers[E][W]

  const jokes = [
    '',
    ' (Wallets have feelings too 😅)',
    " (My wallet and I have that exact conversation every Friday — it usually wins 😄)",
  ]
  const joke = jokes[H]

  const b2 = [
    // Consultative
    `No rush at all. Want me to send you our free ${b.freebie} in the meantime? Whenever the timing feels right, I'll be here.`,
    // Balanced
    `Would ${b.lite} be a better fit for now? It's a lovely way to start, and there's zero pressure either way.`,
    // Persistent
    `That's exactly why we offer split-pay — 3 × $${Math.ceil(b.price / 3)} — and if you order today I can take 15% off ${b.product}. Shall I reserve one?`,
  ][P]

  const warmthTail = ['', W === 1 ? ' 😊' : '', ' ✨']
  let bubbles = [opener + joke, b2 + (P === 0 ? warmthTail[W] : '')]
  if (warmth < 30) bubbles = bubbles.map(stripEmoji)

  // Outcome forecast (heuristic model shown to investors)
  const trust = clamp(Math.round(25 + empathy * 0.38 + warmth * 0.28 + (humor > 30 && humor < 85 ? 8 : 0) - persistence * 0.18))
  const closeNow = clamp(Math.round(6 + persistence * 0.32 + warmth * 0.06 - (100 - empathy) * 0.03))
  const comeBack = clamp(Math.round(18 + empathy * 0.32 + warmth * 0.22 + humor * 0.08 - persistence * 0.28))

  const tone = [
    E === 2 ? 'Deeply empathetic' : E === 1 ? 'Understanding' : 'Matter-of-fact',
    W === 2 ? 'Best-friend warm' : W === 1 ? 'Friendly' : 'Professional',
    H === 2 ? 'Playful' : H === 1 ? 'Light-hearted' : 'Serious',
    P === 2 ? 'Persuasive' : P === 1 ? 'Balanced' : 'Patient advisor',
  ]

  return { bubbles, forecast: { trust, closeNow, comeBack }, tone }
}
