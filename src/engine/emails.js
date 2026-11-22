// Email marketing generator (Instant Demo Mode).
// Turns hippocampus memories + the conversation's emotional arc into a 3-step follow-up sequence.
import { level, stripEmoji } from '../lib/utils'

const mem = (memories, kind) => memories.find((m) => m.meta?.kind === kind)

export const deriveCustomerName = (memories) => mem(memories, 'name')?.meta?.name || ''

export const generateCampaign = ({ business: b, persona, memories, limbic, customerName, variant = 0 }) => {
  const name = customerName?.trim() || 'there'
  const ev = mem(memories, 'event')
  const cash = mem(memories, 'cash')
  const wound = mem(memories, 'wound')
  const occ = mem(memories, 'occasion')
  const like = mem(memories, 'like')
  const W = level(persona.warmth)
  const H = level(persona.humor)
  const P = level(persona.persistence)
  const sign = `${b.botName} at ${b.brand}`
  const trust = limbic?.accumbens?.trust ?? 60

  const hello = W === 'high' ? `Hi ${name}! 👋` : W === 'mid' ? `Hi ${name},` : `Hello ${name},`
  const evText = ev ? `${ev.meta.noun}` : null
  const untilQ = cash?.meta?.until ? (/^q[1-4]$/.test(cash.meta.until) ? cash.meta.until.toUpperCase() : cash.meta.until) : null

  const subjects1 = [
    ev ? `How's the ${evText} prep going, ${name}?` : `Just checking in, ${name} ☕`,
    ev ? `Thinking of your ${evText} launch 💛` : `A quick hello from ${b.brand}`,
  ]
  const subjects2 = [
    ev ? `A little something for your ${evText}` : `Something useful (no strings attached)`,
    `We made this with you in mind, ${name}`,
  ]
  const subjects3 = [
    untilQ ? `${untilQ} is here — a small welcome back 🎁` : `Saved a little something for you`,
    ev ? `For when the ${evText} is up and running` : `Whenever you're ready, ${name}`,
  ]

  const v = variant % 2

  const day1 = {
    day: 1,
    label: 'Warm check-in',
    goal: 'Rapport',
    subject: subjects1[v],
    preview: ev ? `No sales talk — just wanted to say good luck with the ${evText}.` : 'No sales talk — just a genuine thank-you.',
    body: [
      hello,
      ev
        ? `I really enjoyed chatting with you yesterday. ${ev.text.replace(/^\w/, (c) => c.toUpperCase())} is such an exciting chapter — I hope the prep is going smoothly${W === 'high' ? ' (and that you’re getting at least some sleep 😄)' : ''}.`
        : `Thanks so much for stopping by and chatting with us yesterday — it genuinely made our day.`,
      cash
        ? `No pressure at all about ${b.product}. You mentioned timing is tight${untilQ ? ` until ${untilQ}` : ''}, and that's completely okay. Building something real comes first.`
        : `If any questions pop up, just hit reply — a real human-sounding buddy (me!) reads every message.`,
      wound ? `And after your last experience with another brand, I want you to know: ${b.guarantee}. You're safe with us.` : '',
      `Rooting for you,`,
    ],
    cta: { label: 'Reply to say hi', href: `mailto:hello@${b.domain}` },
    openRate: Math.min(78, 52 + Math.round(trust / 6)),
  }

  const day14 = {
    day: 14,
    label: 'Value share',
    goal: 'Give first',
    subject: subjects2[v],
    preview: `Our free ${b.freebie} — ours to give, yours to keep.`,
    body: [
      hello,
      `I've been thinking about what would actually help ${ev ? `someone ${ev.meta.verb === 'opening' ? 'opening' : 'launching'} a ${evText}` : 'you'} right now — so here's our ${b.freebie}, completely free.`,
      ev
        ? `A lot of our ${b.label.toLowerCase()} customers who were just starting out told us the first month is all about small wins. This is one of them.`
        : `It's the most-loved thing we've ever made, and it's yours — no email gate, no strings.`,
      like ? `Also, since you love ${like.meta.what}, I added a couple of tips I think you'll enjoy.` : '',
      occ ? `P.S. Good luck with the ${occ.meta.what} — let me know if you'd like gift-wrapping ideas!` : '',
      H === 'high' ? `No quiz at the end, I promise 😄` : `Enjoy,`,
    ],
    cta: { label: `Get the ${b.freebie.split('(')[0].trim()}`, href: `https://${b.freeLink}` },
    openRate: Math.min(74, 46 + Math.round(trust / 5)),
  }

  const offer = P === 'high' ? '20% off' : P === 'mid' ? '15% off' : '10% off plus free shipping'
  const day30 = {
    day: 30,
    label: 'Gentle return offer',
    goal: 'Re-engage',
    subject: subjects3[v],
    preview: `A small, no-pressure thank-you — valid whenever the timing is right.`,
    body: [
      hello,
      untilQ
        ? `${untilQ} is around the corner, and I remembered you mentioned that's when things might ease up. So I saved you a little welcome-back gift: ${offer} on ${b.product}.`
        : ev
          ? `I hope the ${evText} is off to a wonderful start! When you're ready, I've saved you ${offer} on ${b.product} — as a little congratulations.`
          : `It's been a month, and I wanted to say thanks for being part of the ${b.brand} family. Here's ${offer} on ${b.product} whenever the timing feels right.`,
      `It doesn't expire this week or next — ${P === 'high' ? 'though it does run out at the end of the month' : 'there’s genuinely no countdown timer here'}. ${b.guarantee.charAt(0).toUpperCase() + b.guarantee.slice(1)}.`,
      `And if now still isn't the moment, that's okay too. I'll be here.`,
      W === 'low' ? 'Best regards,' : 'With warmth,',
    ],
    cta: { label: `Claim my ${offer.split(' plus')[0]}`, href: `https://${b.domain}/welcome-back` },
    openRate: Math.min(70, 41 + Math.round(trust / 5)),
  }

  const clean = (e) => {
    const body = e.body.filter(Boolean)
    return {
      ...e,
      subject: persona.warmth < 35 ? stripEmoji(e.subject) : e.subject,
      body: persona.warmth < 35 ? body.map(stripEmoji) : body,
      signature: sign,
    }
  }

  return [clean(day1), clean(day14), clean(day30)]
}

export const campaignToText = (campaign) =>
  campaign
    .map(
      (e) =>
        `── Day ${e.day} · ${e.label} ──\nSubject: ${e.subject}\n\n${e.body.join('\n\n')}\n${e.signature}\n\n[${e.cta.label}] ${e.cta.href}`,
    )
    .join('\n\n\n')
