// Optional Live LLM Mode. Calls the provider directly from the browser with a key the presenter
// pastes into Settings (stored only in this browser's localStorage). If anything fails, callers
// fall back to the local Instant Demo engine so a live pitch never breaks.
import { STRATEGIES } from './limbic'

export const PROVIDERS = {
  anthropic: { label: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-5-5', keyHint: 'sk-ant-…' },
  openai: { label: 'OpenAI', defaultModel: 'gpt-5-mini', keyHint: 'sk-…' },
}

const describe = (v, low, mid, high) => (v >= 67 ? high : v >= 34 ? mid : low)

export const compileSystemPrompt = ({ persona, business: b, limbic }) => {
  const s = limbic.pfc.strategy
  const memories = limbic.hippocampus.map((m) => `- [${m.tag}] ${m.text}`).join('\n') || '- (nothing yet)'
  return `You are ${b.botName}, the friendly sales buddy for ${b.brand} (${b.label}), chatting with a customer on WhatsApp.

PRODUCT FACTS (use only these):
- Hero product: ${b.product}, $${b.price}. Split-pay: 3 x $${Math.ceil(b.price / 3)}.
- Lighter option: ${b.lite}. Bestseller: ${b.bestseller}. Add-on: ${b.addon} (bundle saves ${b.bundleSave}).
- Value: ${b.valueProp}. Proof: ${b.proof}. Guarantee: ${b.guarantee}. Shipping: ${b.shipping}
- Free gift you may share: ${b.freebie} at ${b.freeLink}

PERSONALITY (follow precisely):
- Emotional depth ${persona.empathy}/100: ${describe(persona.empathy, 'be matter-of-fact', 'acknowledge feelings briefly', 'notice and validate feelings deeply and sincerely')}.
- Humor ${persona.humor}/100: ${describe(persona.humor, 'no jokes', 'an occasional light touch', 'playful wit, at most one light joke per reply, never at the customer’s expense')}.
- Warmth ${persona.warmth}/100: ${describe(persona.warmth, 'professional, no emojis', 'friendly, the odd emoji', 'like a caring friend, warm emojis welcome')}.
- Sales style ${persona.persistence}/100: ${describe(persona.persistence, 'patient consultant: never push, ask questions', 'balanced: suggest options gently', 'persistent closer: make confident offers and create gentle urgency')}.

LIMBIC STATE (your internal emotional read of the customer):
- Amygdala: signal "${limbic.amygdala.signal}", valence ${limbic.amygdala.valence}, friction ${limbic.amygdala.friction}/100.
- Nucleus accumbens: trust ${limbic.accumbens.trust}%, delight ${limbic.accumbens.delight}%.
- Hippocampus memories about this customer:
${memories}
- Prefrontal cortex strategy for THIS reply: ${STRATEGIES[s].label} — ${limbic.pfc.rationale}${limbic.pfc.mode ? `\n- MODE: ${limbic.pfc.mode}. Do NOT sell. Validate, give the free gift, and offer a respectful check-in ${limbic.pfc.checkIn ? limbic.pfc.checkIn.when : 'later'}.` : ''}

STYLE RULES:
- Sound like a real human texting. 1–3 short messages separated by a blank line. Max 60 words total.
- No markdown, no bullet points. If asked, be honest that you are an AI assistant. Recall a memory naturally if relevant (once).
- Respond to what the customer actually said, even if it is off-topic, emotional, or a question about you or Easy Buddy.
- SAFETY FIRST: if the customer mentions a medical emergency (e.g. can't breathe, chest pain) or self-harm, stop all selling, urge them to contact local emergency services or a crisis line, and be kind.`
}

const normaliseHistory = (messages) => {
  const out = []
  for (const m of messages) {
    const role = m.from === 'user' ? 'user' : 'assistant'
    if (!out.length && role === 'assistant') continue
    const last = out[out.length - 1]
    if (last && last.role === role) last.content += `\n${m.text}`
    else out.push({ role, content: m.text })
  }
  return out
}

export const callLLM = async ({ settings, system, messages, maxTokens = 400 }) => {
  const { provider, apiKey } = settings
  const model = settings.model || PROVIDERS[provider].defaultModel
  const history = Array.isArray(messages) && messages.length && messages[0].from ? normaliseHistory(messages) : messages

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: history }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || `Anthropic error ${res.status}`)
    return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim()
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_completion_tokens: Math.max(maxTokens * 3, 1200),
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`)
  return (data.choices?.[0]?.message?.content || '').trim()
}

export const toBubbles = (text) =>
  text
    .split(/\n\s*\n|\n/)
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 4)

export const llmCampaign = async ({ settings, business: b, persona, memories, customerName }) => {
  const system = `You write warm, emotionally intelligent marketing emails for ${b.brand} (${b.label}). Hero product: ${b.product} ($${b.price}). Free gift: ${b.freebie} (${b.freeLink}). Guarantee: ${b.guarantee}. Signature: "${b.botName} at ${b.brand}". Warmth ${persona.warmth}/100, humor ${persona.humor}/100, sales persistence ${persona.persistence}/100. Return ONLY valid JSON.`
  const prompt = `Customer first name: ${customerName || 'there'}.
Memory notes from our chat:
${memories.map((m) => `- [${m.tag}] ${m.text}`).join('\n') || '- none'}

Write a 3-email follow-up sequence: Day 1 warm check-in (no selling), Day 14 value share (give the free gift), Day 30 gentle return offer. Reference the memory notes naturally.
Return JSON: {"emails":[{"day":1,"label":"Warm check-in","goal":"Rapport","subject":"...","preview":"...","body":["paragraph", "..."],"cta":{"label":"...","href":"https://..."}}, ...]}`
  const text = await callLLM({ settings, system, messages: [{ role: 'user', content: prompt }], maxTokens: 1600 })
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  return json.emails.slice(0, 3).map((e, i) => ({
    day: e.day ?? [1, 14, 30][i],
    label: e.label ?? ['Warm check-in', 'Value share', 'Gentle return offer'][i],
    goal: e.goal ?? ['Rapport', 'Give first', 'Re-engage'][i],
    subject: e.subject,
    preview: e.preview ?? '',
    body: Array.isArray(e.body) ? e.body : String(e.body).split(/\n\s*\n/),
    cta: e.cta?.label ? e.cta : { label: 'Visit us', href: `https://${b.domain}` },
    openRate: [64, 58, 52][i],
    signature: `${b.botName} at ${b.brand}`,
  }))
}
