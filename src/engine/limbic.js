// ─────────────────────────────────────────────────────────────────────────────
// Limbic System Simulation Engine
// A small affective-state model inspired by four limbic / limbic-adjacent regions:
//   Amygdala            → emotional valence, arousal & sales friction from each message
//   Hippocampus         → episodic "rapport memory" (personal context to recall later)
//   Nucleus Accumbens   → reward: trust & delight index of the relationship
//   Prefrontal Cortex   → executive regulation: chooses the conversational strategy
// The engine is deterministic and fully local, so the demo never fails offline.
// ─────────────────────────────────────────────────────────────────────────────
import { clamp, uid, cap } from '../lib/utils'
import { matchRule, ruleMemory, RULE_MAP } from './conversation'

export const PATTERNS = {
  noBudget:
    /(can'?t|cannot|can not|won'?t be able to|unable to) (really )?afford|no budget|out of (my )?budget|(don'?t|do not) have the (money|budget|cash|funds)|cash is (really |super |very |pretty )?tight|tight on (cash|money|funds)|money is (really |super |very )?tight|broke (right now|atm|at the moment)|i'?m broke|not in (the|my) budget|can'?t justify|can'?t spend/i,
  bad:
    /(bad experience|burn(ed|t) (me|before|by)|got burned|competitor|scam|ripped off|last (company|time|provider|brand)|disappoint|didn'?t work|terrible|awful|let (me )?down|never again|waste of money|poor quality)/i,
  ready:
    /(ready to (buy|order|go|start|sign|purchase)|i'?ll take (it|one|two)|sign me up|let'?s do (it|this)|buy (it|now|one)|purchase|checkout|check out|where do i pay|i'?m in\b|order (it|now|one)|take it|add(ing)? (it )?to (my )?cart|i want (it|one|to buy))/i,
  negative: /(no thanks|not interested|stop (messaging|texting)|leave me alone|go away|unsubscribe|don'?t message)/i,
  price:
    /(expensive|pricey|price|cost|too much|cheaper|discount|budget|\$\s?\d+|money|afford|worth it|pay for)/i,
  skeptic:
    /(really\?|are you sure|doubt|skeptic|sounds too good|prove it|is this legit|what'?s the catch|hidden fee|fake reviews|not convinced)/i,
  frustrated: /(annoy|frustrat|ugh|angry|upset|stress|overwhelm|so tired|exhaust|hate)/i,
  browsing:
    /(just (browsing|looking|checking)|window.?shopping|not sure yet|maybe later|only looking|having a look|having a browse)/i,
  thanks: /(thank|thanks|thx|\bty\b|appreciate|cheers|so kind|that'?s kind|lovely of you|🥹|🙏)/i,
  question:
    /(\?|how (does|do|much|long|many)|what (is|are|does|'?s)|can (it|you|i)|does it|is there|do you)/i,
  greet: /^\s*(hi|hello|hey|hiya|yo|good (morning|afternoon|evening)|howdy|heya)\b/i,
  excite: /(love|amazing|awesome|cool|great|nice|wow|perfect|excited|beautiful|gorgeous|stunning|😍|🔥|❤️|🤩)/i,
}

const INTENT_ORDER = [
  'noBudget',
  'bad',
  'ready',
  'negative',
  'price',
  'skeptic',
  'frustrated',
  'browsing',
  'thanks',
  'question',
  'greet',
  'excite',
]

// Amygdala appraisal targets per intent: valence (-100..100), arousal (0..100), friction (0..100)
const APPRAISAL = {
  noBudget: { valence: -38, arousal: 58, friction: 74, signal: 'Budget stress' },
  bad: { valence: -55, arousal: 72, friction: 82, signal: 'Distrust · past wound' },
  ready: { valence: 82, arousal: 78, friction: 6, signal: 'Purchase excitement' },
  negative: { valence: -60, arousal: 42, friction: 88, signal: 'Disengagement' },
  price: { valence: -16, arousal: 46, friction: 56, signal: 'Price hesitation' },
  skeptic: { valence: -22, arousal: 52, friction: 62, signal: 'Skepticism' },
  frustrated: { valence: -42, arousal: 68, friction: 58, signal: 'Stress · overwhelm' },
  browsing: { valence: 6, arousal: 20, friction: 32, signal: 'Low-commitment curiosity' },
  thanks: { valence: 66, arousal: 38, friction: 4, signal: 'Gratitude' },
  question: { valence: 18, arousal: 42, friction: 20, signal: 'Active curiosity' },
  greet: { valence: 32, arousal: 32, friction: 10, signal: 'Open & friendly' },
  excite: { valence: 68, arousal: 72, friction: 8, signal: 'Delight · excitement' },
  neutral: { valence: 6, arousal: 24, friction: 20, signal: 'Neutral' },
}

export const STRATEGIES = {
  DISCOVER: { label: 'Discover', color: '#6366f1', desc: 'Ask, learn, build context' },
  LISTEN: { label: 'Listen & Validate', color: '#0ea5e9', desc: 'Empathise before anything else' },
  HUMOR: { label: 'Light Humor', color: '#f59e0b', desc: 'Lower tension with warmth' },
  PITCH: { label: 'Value Pitch', color: '#10b981', desc: 'Share value at the right moment' },
  CLOSE: { label: 'Close', color: '#059669', desc: 'Remove friction, make buying easy' },
  STEP_BACK: { label: 'Step Back', color: '#f9694a', desc: 'Protect goodwill & lifetime value' },
  SAFETY: { label: 'Safety Override', color: '#dc2626', desc: 'Human safety before any sale' },
}

export const initialLimbic = () => ({
  amygdala: { valence: 10, arousal: 18, friction: 12, signal: 'Awaiting customer', cues: [] },
  hippocampus: [],
  accumbens: { trust: 52, delight: 40 },
  pfc: {
    strategy: 'DISCOVER',
    rationale: 'Waiting for the first message. Default posture: curious and welcoming.',
    mode: null,
    checkIn: null,
    confidence: 60,
  },
  recalled: [],
  pulse: { amygdala: 0, hippocampus: 0, accumbens: 0, pfc: 0 },
  history: [{ t: 0, trust: 52, friction: 12, delight: 40 }],
  turn: 0,
  lastIntent: null,
})

export const detectIntent = (text) => {
  const hits = INTENT_ORDER.filter((k) => PATTERNS[k].test(text))
  const intent = hits[0] || 'neutral'
  const cues = hits
    .map((k) => {
      const m = text.match(PATTERNS[k])
      return m ? m[0].trim() : null
    })
    .filter(Boolean)
    .slice(0, 4)
  return { intent, hits, cues }
}

// ── Hippocampus: extract personal context worth remembering ──────────────────
const STOP = '(?!next\\b|this\\b|in\\b|soon\\b|and\\b|but\\b|so\\b|for\\b|with\\b|that\\b|which\\b|on\\b|at\\b)'
const EVENT_RE = new RegExp(
  `\\b(launching|opening|starting|building|planning)\\s+(?:a|an|my|our)\\s+(?:little\\s+|new\\s+|small\\s+|tiny\\s+|first\\s+)?([a-z]+)(?:\\s+${STOP}([a-z]+))?(?:[^.!?]*?\\b(next (?:week|month|year|spring|summer)|this (?:week|month|year|weekend|summer|spring)|in (?:a few |\\d+ |two |three )?(?:weeks?|months?)|soon))?`,
  'i',
)
const CASH_RE =
  /(?:tight|short|low|broke|strapped|limited)[^.!?]*?\b(?:until|till|til|before)\s+(q[1-4]|next (?:week|month|year)|(?:january|february|march|april|may|june|july|august|september|october|november|december)|payday|the new year|spring|summer|fall|autumn|winter)/i
const UNTIL_RE = /\b(?:until|till|til)\s+(q[1-4]|next month|payday|(?:january|february|march|april|may|june|july|august|september|october|november|december))\b/i
const RELATION_RE = /\bmy (wife|husband|partner|girlfriend|boyfriend|daughter|son|kids|mum|mom|dad|sister|brother|best friend|team|boss|business partner)\b/i
const OCCASION_RE = /\b(birthday|wedding|anniversary|graduation|baby shower|christmas|holiday|housewarming|valentine'?s?)\b/i
const NAME_RE = /\b(?:[Mm]y name(?:'s| is)|[Ii]'?m|[Ii] am|[Tt]his is|[Ii]t'?s)\s+([A-Z][a-z]{2,14})\b/
const NOT_NAMES = new Set(['Ready', 'Just', 'Not', 'Opening', 'Launching', 'Starting', 'Looking', 'Interested', 'Sorry', 'Sure', 'Fine', 'Good', 'Great', 'Okay', 'Here', 'Very', 'Really', 'Super', 'Planning', 'Building', 'Broke', 'Tight', 'Still', 'Also', 'Honestly', 'Back'])
const LIKE_RE = /\bi (?:really )?(love|prefer|adore|like)\s+([a-z][a-z ]{2,24}?)(?=[.,!?]|$| and| but| so)/i
const BUDGET_RE = /(?:budget|spend|afford)[^.!?$]*?\$\s?(\d{2,5})|\$\s?(\d{2,5})[^.!?]*?(?:budget|max|tops)/i

const article = (noun) => (/^[aeiou]/i.test(noun) ? 'an' : 'a')

const QUARTER_CHECKIN = { q1: 'early January', q2: 'early April', q3: 'early July', q4: 'early October' }

export const extractMemories = (text, existing = []) => {
  const found = []
  const has = (t) => existing.some((m) => m.text.toLowerCase() === t.toLowerCase()) || found.some((m) => m.text.toLowerCase() === t.toLowerCase())
  const add = (mem) => {
    if (!has(mem.text)) found.push({ id: uid(), ts: Date.now(), ...mem })
  }

  const ev = text.match(EVENT_RE)
  if (ev) {
    const noun = [ev[2], ev[3]].filter(Boolean).join(' ').toLowerCase()
    const when = ev[4] ? ev[4].toLowerCase() : ''
    const verb = ev[1].toLowerCase()
    add({
      tag: 'Life event',
      text: `${cap(verb)} ${article(noun)} ${noun}${when ? ` ${when}` : ''}`,
      meta: { kind: 'event', verb, noun, when },
    })
  }

  const cash = text.match(CASH_RE) || (PATTERNS.noBudget.test(text) ? text.match(UNTIL_RE) : null)
  if (cash) {
    const raw = cash[1].toLowerCase()
    const until = /^q[1-4]$/.test(raw) ? raw.toUpperCase() : raw.replace(/^\w/, (c) => (/(january|february|march|april|may|june|july|august|september|october|november|december)/.test(raw) ? c.toUpperCase() : c))
    add({ tag: 'Financial timing', text: `Tight on cash until ${until}`, meta: { kind: 'cash', until: raw } })
  } else if (PATTERNS.noBudget.test(text)) {
    add({ tag: 'Financial timing', text: 'Budget is paused for now', meta: { kind: 'cash', until: null } })
  }

  const rel = text.match(RELATION_RE)
  if (rel) add({ tag: 'Relationship', text: `Buying with / for their ${rel[1].toLowerCase()}`, meta: { kind: 'relation', who: rel[1].toLowerCase() } })

  const occ = text.match(OCCASION_RE)
  if (occ) add({ tag: 'Occasion', text: `Upcoming ${occ[1].toLowerCase()}`, meta: { kind: 'occasion', what: occ[1].toLowerCase() } })

  const nm = text.match(NAME_RE)
  if (nm && !NOT_NAMES.has(nm[1])) add({ tag: 'Identity', text: `Name: ${nm[1]}`, meta: { kind: 'name', name: nm[1] } })

  const like = text.match(LIKE_RE)
  if (like && !/(it|this|that|them|you)$/i.test(like[2].trim())) add({ tag: 'Preference', text: `${cap(like[1].toLowerCase())}s ${like[2].trim()}`, meta: { kind: 'like', what: like[2].trim() } })

  const bud = text.match(BUDGET_RE)
  if (bud) add({ tag: 'Budget', text: `Comfortable budget ≈ $${bud[1] || bud[2]}`, meta: { kind: 'budget', amount: bud[1] || bud[2] } })

  if (PATTERNS.bad.test(text)) add({ tag: 'Pain point', text: 'Burned by a competitor before — needs reassurance', meta: { kind: 'wound' } })

  return found
}

export const checkInFrom = (memories) => {
  const cash = memories.find((m) => m.meta?.kind === 'cash' && m.meta.until)
  if (cash) {
    const u = cash.meta.until
    if (QUARTER_CHECKIN[u]) return { when: QUARTER_CHECKIN[u], label: `When ${u.toUpperCase()} begins` }
    if (u === 'next month') return { when: 'in about 4 weeks', label: 'Start of next month' }
    if (u === 'payday') return { when: 'right after payday', label: 'After payday' }
    if (u === 'next year' || u === 'the new year') return { when: 'in the new year', label: 'New year' }
    return { when: `in early ${cap(u)}`, label: `Early ${cap(u)}` }
  }
  const ev = memories.find((m) => m.meta?.kind === 'event')
  if (ev) return { when: 'a couple of weeks after your launch', label: 'Post-launch check-in' }
  return { when: 'in about 3 weeks', label: '3-week gentle check-in' }
}

// ── Prefrontal cortex: executive strategy selection ──────────────────────────
const chooseStrategy = (intent, persona, trust) => {
  const { humor, persistence, empathy } = persona
  switch (intent) {
    case 'noBudget':
      return {
        strategy: 'STEP_BACK',
        mode: 'Relationship Preservation',
        rationale:
          'Budget stress detected. Pushing now would burn goodwill. Protect lifetime value: validate, gift real value, schedule a respectful check-in.',
        confidence: 94,
      }
    case 'bad':
      return {
        strategy: 'LISTEN',
        rationale: 'Past wound detected (competitor). Validate first and rebuild safety before any offer.',
        confidence: 88,
      }
    case 'ready':
      return { strategy: 'CLOSE', rationale: 'Strong buying signal. Remove all friction and give the fastest path to checkout.', confidence: 96 }
    case 'negative':
      return {
        strategy: 'STEP_BACK',
        mode: 'Graceful Exit',
        rationale: 'Customer wants space. Exit gracefully and leave the door open — no follow-up pressure.',
        confidence: 92,
      }
    case 'price':
      return persistence >= 60
        ? { strategy: 'PITCH', rationale: 'Price hesitation with high persistence setting → reframe value and offer split-pay.', confidence: 71 }
        : { strategy: 'LISTEN', rationale: 'Price hesitation. Consultative mode → explore what budget fits before suggesting options.', confidence: 82 }
    case 'skeptic':
      return { strategy: 'LISTEN', rationale: 'Skepticism detected. Respond with honest proof and risk reversal, not hype.', confidence: 80 }
    case 'frustrated':
      return { strategy: 'LISTEN', rationale: 'Elevated stress. Humor would be tone-deaf right now — simplify and support.', confidence: 86 }
    case 'browsing':
      return humor >= 55
        ? { strategy: 'HUMOR', rationale: 'Low-commitment browsing. A light joke lowers pressure and boosts memorability.', confidence: 77 }
        : { strategy: 'DISCOVER', rationale: 'Low-commitment browsing. Offer gentle guidance without pressure.', confidence: 74 }
    case 'thanks':
      return humor >= 50
        ? { strategy: 'HUMOR', rationale: 'Positive reward signal. Reinforce delight with warmth and a smile.', confidence: 80 }
        : { strategy: 'DISCOVER', rationale: 'Positive reward signal. Reinforce the relationship and stay helpful.', confidence: 78 }
    case 'question':
      return trust >= 45
        ? { strategy: 'PITCH', rationale: 'Curiosity + sufficient trust → share helpful product value.', confidence: 79 }
        : { strategy: 'DISCOVER', rationale: 'Curiosity but trust is still forming → answer simply, ask about needs.', confidence: 72 }
    case 'greet':
      return { strategy: 'DISCOVER', rationale: 'Opening move. Build rapport and learn context before any pitch.', confidence: 85 }
    case 'excite':
      return persistence >= 45
        ? { strategy: 'PITCH', rationale: 'Delight spike → good moment to suggest a complementary bundle.', confidence: 76 }
        : { strategy: 'HUMOR', rationale: 'Delight spike → amplify the joy, no pressure.', confidence: 74 }
    default:
      return {
        strategy: 'DISCOVER',
        rationale: empathy > 60 ? 'Unclear intent. Ask a warm, open question to understand needs.' : 'Unclear intent. Ask a clarifying question.',
        confidence: 64,
      }
  }
}

const smooth = (prev, target, k = 0.72) => Math.round(prev * (1 - k) + target * k)

// Step 1 of a turn: perception (amygdala), memory (hippocampus), executive control (PFC)
export const perceive = (text, prev, persona) => {
  const detected = detectIntent(text)
  // Human conversation rules (safety, feelings, small talk, investor questions…) take precedence
  const rule = matchRule(text, detected.intent)
  const intent = rule ? rule.id : detected.intent
  const { hits } = detected
  const cues = rule ? [rule.appraisal.signal.split(' · ')[0], ...detected.cues].slice(0, 4) : detected.cues
  const target = { ...(rule ? rule.appraisal : APPRAISAL[intent]) }
  if (intent !== 'excite' && hits.includes('excite')) target.valence += 15
  if (intent !== 'thanks' && hits.includes('thanks')) target.valence += 10

  const amygdala = {
    valence: clamp(smooth(prev.amygdala.valence, target.valence), -100, 100),
    arousal: clamp(smooth(prev.amygdala.arousal, target.arousal)),
    friction: clamp(smooth(prev.amygdala.friction, target.friction)),
    signal: target.signal,
    cues,
  }

  const newMemories = extractMemories(text, prev.hippocampus)
  const ruleMem = ruleMemory(rule, text)
  if (ruleMem && !prev.hippocampus.some((m) => m.text === ruleMem.text)) newMemories.push(ruleMem)
  const hippocampus = [...newMemories, ...prev.hippocampus]

  const exec = rule ? rule.exec(persona, prev) : chooseStrategy(intent, persona, prev.accumbens.trust)
  const pfc = {
    strategy: exec.strategy,
    prevStrategy: prev.pfc.strategy,
    rationale: exec.rationale,
    // Relationship Preservation persists through warm follow-ups until the customer re-opens buying
    mode: exec.mode || (prev.pfc.mode === 'Relationship Preservation' && !['ready', 'price', 'question'].includes(intent) ? prev.pfc.mode : null),
    confidence: exec.confidence,
    checkIn: prev.pfc.checkIn,
  }
  if (intent === 'noBudget') {
    const ci = checkInFrom(hippocampus)
    pfc.checkIn = ci
    hippocampus.unshift({
      id: uid(),
      ts: Date.now(),
      tag: 'Check-in trigger',
      text: `Gentle check-in scheduled · ${ci.label}`,
      meta: { kind: 'trigger', when: ci.when },
    })
  }

  return {
    intent,
    newMemories,
    limbic: {
      ...prev,
      amygdala,
      hippocampus,
      pfc,
      turn: prev.turn + 1,
      lastIntent: intent,
      pulse: {
        amygdala: prev.pulse.amygdala + 1,
        hippocampus: prev.pulse.hippocampus + (newMemories.length || intent === 'noBudget' ? 1 : 0),
        accumbens: prev.pulse.accumbens,
        pfc: prev.pulse.pfc + 1,
      },
    },
  }
}

// Step 2 of a turn: reward update (nucleus accumbens) after the reply has been chosen
const TRUST_DELTA = {
  noBudget: 17,
  bad: 9,
  ready: 8,
  negative: 3,
  price: 5,
  skeptic: 6,
  frustrated: 7,
  browsing: 4,
  thanks: 7,
  question: 5,
  greet: 5,
  excite: 6,
  neutral: 2,
}

export const reward = (limbic, { intent, persona, recalled = [], trained = false }) => {
  const e = persona.empathy / 100
  const w = persona.warmth / 100
  const h = persona.humor / 100
  const p = persona.persistence / 100
  const strat = limbic.pfc.strategy

  let dTrust = (TRUST_DELTA[intent] ?? RULE_MAP[intent]?.trust ?? 3) * (0.45 + e * 0.6 + w * 0.25)
  // Pushing hard on price or a wounded customer erodes trust
  if (strat === 'PITCH' && (intent === 'price' || intent === 'noBudget')) dTrust -= p * 9
  if (intent === 'price' || intent === 'skeptic') dTrust -= Math.max(0, p - 0.6) * 12
  if (recalled.length) dTrust += 6
  if (trained) dTrust *= 1.2
  // Diminishing returns: trust is hard-won near the top, so the HUD stays meaningful
  if (dTrust > 0) dTrust *= Math.min(1, (100 - limbic.accumbens.trust) / 45)

  let dDelight = 2 + w * 4
  if (strat === 'HUMOR') dDelight += 6 + h * 8
  if (intent === 'noBudget') dDelight += 9 + e * 6 // unexpected kindness is memorable
  if (intent === 'ready' || intent === 'excite' || intent === 'thanks') dDelight += 6
  if (recalled.length) dDelight += 5
  if (h > 0.85 && (intent === 'frustrated' || intent === 'bad')) dDelight -= 4

  const trust = clamp(Math.round(limbic.accumbens.trust + dTrust))
  const delight = clamp(Math.round(limbic.accumbens.delight + dDelight))
  return {
    ...limbic,
    accumbens: { trust, delight },
    recalled: [...limbic.recalled, ...recalled],
    pulse: { ...limbic.pulse, accumbens: limbic.pulse.accumbens + 1 },
    history: [
      ...limbic.history,
      { t: limbic.history.length, trust, friction: limbic.amygdala.friction, delight },
    ].slice(-24),
  }
}
