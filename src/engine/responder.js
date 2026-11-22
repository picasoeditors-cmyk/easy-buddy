// ─────────────────────────────────────────────────────────────────────────────
// Instant Demo Mode reply generator.
// Composes human-sounding WhatsApp-style replies from:
//   • the intent read by the amygdala
//   • the strategy chosen by the prefrontal cortex
//   • hippocampus memories (recalled naturally, once)
//   • the four persona sliders (empathy, humor, warmth, persistence)
// ─────────────────────────────────────────────────────────────────────────────
import { level, pick, stripEmoji } from '../lib/utils'
import { RULE_MAP } from './conversation'

const lv = (persona) => ({
  e: level(persona.empathy),
  h: level(persona.humor),
  w: level(persona.warmth),
  p: level(persona.persistence),
})

const third = (price) => `$${Math.ceil(price / 3)}`

const memoryOf = (memories, kind) => memories.find((m) => m.meta?.kind === kind)

// A natural, one-time recall line built from hippocampus memories
const recallLine = (memories, recalledIds, intent) => {
  // In Relationship Preservation the bot may revisit a life event even if mentioned before
  const fresh = memories.filter((m) => (intent === 'noBudget' || !recalledIds.includes(m.id)) && m.meta?.kind !== 'trigger')
  const ev = fresh.find((m) => m.meta?.kind === 'event')
  if (ev) {
    const { noun, when } = ev.meta
    if (intent === 'noBudget')
      return { id: ev.id, text: `${ev.text} is a big, brave thing — cash flow absolutely comes first right now.` }
    return { id: ev.id, text: `And congrats on the ${noun}${when ? ` ${when}` : ''} — that's genuinely exciting!` }
  }
  const occ = fresh.find((m) => m.meta?.kind === 'occasion')
  if (occ) return { id: occ.id, text: `Is this for the ${occ.meta.what}? I can add a little gift note if you like.` }
  const rel = fresh.find((m) => m.meta?.kind === 'relation')
  if (rel) return { id: rel.id, text: `I hope your ${rel.meta.who} loves it as much as you do.` }
  const like = fresh.find((m) => m.meta?.kind === 'like')
  if (like) return { id: like.id, text: `Since you love ${like.meta.what}, I think you'll really enjoy this one.` }
  return null
}

const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const nameOf = (memories) => memoryOf(memories, 'name')?.meta?.name

// Builders return an array of bubble strings
const BUILDERS = {
  greet: ({ b, L, seed, name, persona }) => {
    const hi = L.w === 'high' ? `Hey${name ? ` ${name}` : ''}! 👋 So lovely to hear from you.` : L.w === 'mid' ? `Hi${name ? ` ${name}` : ''}! Welcome to ${b.brand} 😊` : `Hello, welcome to ${b.brand}.`
    const ask = pick(
      [
        `What brings you in today — something for yourself, or a gift?`,
        `Tell me a little about what you're looking for and I'll point you to the good stuff.`,
      ],
      seed,
    )
    const joke = L.h === 'high' ? ` (I'm the helpful kind of chat bubble, not the pop-up-every-5-seconds kind 😄)` : ''
    return persona.persistence > 70 ? [hi, `${ask} We've got 10% off ${b.product} this week too.`] : [hi, ask + joke]
  },

  ready: ({ b, L }) => {
    const yay = L.w === 'high' ? `Yay, amazing choice! 🎉` : L.w === 'mid' ? `Great choice! 🙌` : `Great choice.`
    const link = `Here's your express checkout: ${b.domain}/checkout — ${b.product} is $${b.price}, and ${b.shipping.charAt(0).toLowerCase() + b.shipping.slice(1)}`
    const extra = L.p === 'high' ? ` Want me to add ${b.addon}? Bundled, you save ${b.bundleSave}.` : ` ${cap1(b.guarantee)}, so you're fully covered.`
    return [yay, link + extra]
  },

  price: ({ b, L, strategy, seed }) => {
    if (strategy === 'PITCH') {
      const open = L.e === 'high' ? `Totally fair question — it's a real decision.` : `Fair question!`
      const pitch = `What most customers find is that ${b.valueProp}. We also have split-pay (3 × ${third(b.price)})${L.p === 'high' ? `, and I can take 10% off if you order today` : ''}.`
      const joke = L.h === 'high' ? ` My philosophy: treat yourself, but don't make your bank account cry 😅` : ''
      return [open, pitch + joke]
    }
    const open = L.e === 'high' ? `I hear you — and honestly, I'd much rather you get something that fits than overspend. 💛` : L.e === 'mid' ? `Totally get it — let's find what fits.` : `Understood.`
    const ask = pick(
      [
        `Can I ask what range feels comfortable? A lot of people start with ${b.lite} and upgrade later.`,
        `What matters most to you — the full experience, or keeping it simple? ${cap1(b.lite)} is a lovely starting point.`,
      ],
      seed,
    )
    const joke = L.h === 'high' ? ` (Zero judgement — my wallet and I have that exact conversation weekly 😄)` : ''
    return [open, ask + joke]
  },

  noBudget: ({ b, L, limbic, memories, recall, name }) => {
    const thanks =
      L.e === 'high'
        ? `Honestly${name ? `, ${name}` : ''}, thank you for telling me — that takes trust, and it's completely okay. 🙏`
        : L.e === 'mid'
          ? `That's completely okay${name ? `, ${name}` : ''} — thanks for being upfront with me.`
          : `Understood — no problem at all.`
    const first = recall ? `${thanks} ${recall.text}` : thanks
    const gift = `No pitch from me. Here's something genuinely useful instead, completely free: our ${b.freebie} → ${b.freeLink}`
    const ci = limbic.pfc.checkIn
    const note = `I've made a little note to check in ${ci ? ci.when : 'in a few weeks'} — only if that's okay with you. Until then, I'm rooting for you! ${L.w === 'low' ? '' : '✨'}`
    const joke = L.h === 'high' ? ` (And for the record, we're parting on excellent terms 😄)` : ''
    void memories
    return [first, gift, note + joke]
  },

  bad: ({ b, L }) => {
    const sorry =
      L.e === 'high'
        ? `Oh no — I'm really sorry that happened. Nobody should feel let down after trusting a business with their money. 💛`
        : L.e === 'mid'
          ? `I'm sorry to hear that — that's frustrating.`
          : `Sorry to hear that.`
    const ask = `Would you mind sharing what went wrong? I'd love to make sure we never repeat it. And for peace of mind: ${b.guarantee}.`
    return [sorry, ask]
  },

  skeptic: ({ b, L }) => {
    const open = L.h === 'high' ? `Healthy skepticism — honestly, I respect it 😄` : `That's a fair thing to ask.`
    return [open, `Here's the honest version: ${b.proof}. And ${b.guarantee}, so the risk is on us, not you.`]
  },

  frustrated: ({ L }) => {
    const open = L.e === 'low' ? `Let's make this quick and easy.` : `That sounds like a lot to carry right now. Let's keep this simple for you. 💛`
    return [open, `What's the one thing I can take off your plate today?`]
  },

  negative: ({ L }) => [
    L.w === 'low' ? `Understood — I won't message again.` : `Totally understood — I won't bother you. 🙂`,
    `If you ever need anything, I'm just one message away. Have a lovely day!`,
  ],

  browsing: ({ b, L, strategy }) => {
    if (strategy === 'HUMOR')
      return [`Browsing is my favourite hobby too 😄 Zero pressure.`, `If it helps, our most-loved pick this week is ${b.bestseller}. Want me to show you why people keep coming back for it?`]
    return [
      L.w === 'high' ? `Of course — take all the time you need! ☺️` : `Of course, take your time.`,
      `If you tell me what caught your eye, I can point you to the good stuff in 10 seconds.`,
    ]
  },

  thanks: ({ b, L, persona }) => {
    const out = [L.w === 'high' ? `Aww, anytime! 💛` : `You're welcome!`]
    if (L.h === 'high') out.push(`You just made a chatbot's whole day — and that's genuinely hard to do 😄`)
    else if (persona.persistence > 65) out.push(`Want me to save your cart so it's ready whenever you are?`)
    else out.push(`I'm always here if you need anything from ${b.brand}.`)
    return out
  },

  question: ({ b, L, text, strategy }) => {
    const t = text.toLowerCase()
    let answer
    if (/(ship|deliver|arrive|when will)/.test(t)) answer = b.shipping
    else if (/(return|refund|guarantee|money back|cancel)/.test(t)) answer = `Absolutely — ${b.guarantee}.`
    else if (/(review|rating|legit|trust)/.test(t)) answer = `We have ${b.proof}.`
    else if (/(how much|price|cost)/.test(t)) answer = `${cap1(b.product)} is $${b.price}, or 3 × ${third(b.price)} with split-pay. ${cap1(b.lite)} is a lighter option.`
    else if (new RegExp(`\\b(it|this|that|these|them|product|${b.product.replace(/^the /, '').split(' ').filter((w) => w.length > 3).join('|')})\\b`, 'i').test(t))
      answer = `${cap1(b.product)} is our most popular choice — ${b.valueProp}.`
    else return BUILDERS.neutral({ b, L, text, seed: 0 })
    const open = L.w === 'high' ? `Great question! 😊` : `Good question.`
    const tail = strategy === 'PITCH' && L.p !== 'low' ? ` Want me to set one aside for you?` : ` Anything else you'd like to know?`
    return [open, answer + tail]
  },

  excite: ({ b, L, strategy }) => {
    const open = L.w === 'low' ? `Glad you like it.` : `Right?! I'm so happy you love it 😍`
    if (strategy === 'PITCH') return [open, `It pairs beautifully with ${b.addon} — want me to bundle them so you save ${b.bundleSave}?`]
    return [open, L.h === 'high' ? `Careful — it's dangerously easy to become a regular here 😄` : `Let me know if you'd like any details at all.`]
  },

  // Fallback: never a robotic "Got it" — acknowledge what they actually said, then offer a path
  neutral: ({ b, L, seed, text }) => {
    const said = text.trim().replace(/\s+/g, ' ')
    const quote = said.length <= 42 ? `"${said}"` : 'that'
    if (/\?\s*$/.test(said))
      return [
        L.w === 'low' ? `Good question.` : `Ooh, good question 🤔`,
        `I want to give you a proper answer about ${quote} rather than guess. Could you tell me a little more — or would you like me to bring in someone from the ${b.brand} team?`,
      ]
    return pick(
      [
        [`Thanks for sharing that${L.w === 'low' ? '.' : ' 😊'}`, `When you say ${quote}, tell me a bit more — I'd love to understand what you need.`],
        [L.e === 'low' ? `Understood.` : `I hear you.`, `What would help most right now — a recommendation, prices, or just a friendly chat?`],
        [`I'm all ears${L.w === 'low' ? '.' : ' 👂'}`, `Tell me a little more and I'll point you in the right direction — or ask me anything about ${b.product}.`],
      ],
      seed,
    )
  },
}

// Split very long bubbles into two natural WhatsApp-sized messages
const splitLong = (bubbles) =>
  bubbles.flatMap((bubble) => {
    if (bubble.length < 190) return [bubble]
    // split only at sentence ends followed by a space, so links like site.com stay intact
    const sentences = bubble.split(/(?<=[.!?])\s+/)
    if (sentences.length < 2) return [bubble]
    const mid = Math.ceil(sentences.length / 2)
    return [sentences.slice(0, mid).join(' ').trim(), sentences.slice(mid).join(' ').trim()].filter(Boolean)
  })

export const generateReply = ({ text, intent, limbic, persona, business }) => {
  const L = lv(persona)
  const memories = limbic.hippocampus
  const strategy = limbic.pfc.strategy
  const recall = ['ready', 'question', 'excite', 'greet', 'noBudget', 'thanks', 'neutral', 'price'].includes(intent)
    ? recallLine(memories, limbic.recalled, intent)
    : null
  const rule = RULE_MAP[intent]
  const builder = rule ? rule.reply : BUILDERS[intent] || BUILDERS.neutral
  let bubbles = builder({
    prevStrategy: limbic.pfc.prevStrategy,
    b: business,
    L,
    persona,
    strategy,
    limbic,
    memories,
    recall,
    text,
    seed: limbic.turn,
    name: nameOf(memories),
  })

  // Weave the recall line into the conversation (noBudget handles its own)
  if (recall && intent !== 'noBudget') {
    if (intent === 'greet') bubbles = [bubbles[0] + ' ' + recall.text, ...bubbles.slice(1)]
    else bubbles = [...bubbles.slice(0, -1), bubbles[bubbles.length - 1], recall.text]
  }

  if (persona.warmth < 35) bubbles = bubbles.map(stripEmoji)
  bubbles = splitLong(bubbles.map((s) => s.replace(/\s{2,}/g, ' ').trim()).filter(Boolean)).slice(0, 4)

  return { bubbles, recalled: recall ? [recall.id] : [] }
}

// Human-like typing cadence: longer messages take longer, with natural jitter
export const typingDelay = (text, pace = 'human') => {
  if (pace === 'fast') return 380 + Math.random() * 220
  const base = 650 + text.length * 24
  return Math.min(3400, Math.max(900, base)) * (0.85 + Math.random() * 0.3)
}
