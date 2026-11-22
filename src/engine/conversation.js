// ─────────────────────────────────────────────────────────────────────────────
// Human conversation rules for Instant Demo Mode.
// Sales intents (price, budget, ready…) live in limbic.js. These rules cover everything
// a real person (or a curious investor) might say off-script: safety emergencies, feelings,
// small talk, questions about the bot itself, questions about Easy Buddy as a business,
// and everyday product questions.
//
// priority 'high' → always wins (safety, identity, investor questions)
// priority 'low'  → only wins when the sales engine found nothing stronger
// ─────────────────────────────────────────────────────────────────────────────
import { level, pick, uid } from '../lib/utils'

const JOKES = {
  coffee: ['Why did the coffee file a police report? It got mugged ☕😄', "I tried to make a decaf joke… but it had no punchline 😄"],
  boutique: ["I'd tell you a fashion joke, but it might be a little too *tailored* for you 😄", 'My favourite piece of clothing? Definitely the one that says "free returns" 😄'],
  fitness: ["I was going to tell you a gym joke… but it just didn't work out 😄", 'My favourite exercise? A cross between a lunge and a crunch. I call it lunch 😄'],
  skincare: ['Our serum walked into a bar… and everyone said it was glowing ✨😄', "Why don't skincare bots ever get stressed? We just moisturise and move on 😄"],
  course: ['Why did the student eat their homework? The teacher said it was a piece of cake 🍰😄', "I'd tell you a business joke, but I'm still waiting on the ROI 😄"],
}

const DETAILS = {
  coffee: 'every bag is single-origin, roasted in small batches, and you can choose whole bean or ground for any brewer',
  boutique: 'our pieces are 100% European linen, true to size from XS to XXL, in sage, sand, white and charcoal',
  fitness: 'classes run from 6am to 9pm, all levels are welcome, and your first class includes a free form check',
  skincare: 'everything is vegan, fragrance-free and dermatologist-tested — gentle enough for sensitive skin',
  course: 'it is 6 weeks of short video lessons, live Q&A every Thursday, and templates you can use straight away',
}

const TOPIC = { coffee: 'coffee', boutique: 'linen and style', fitness: 'workouts', skincare: 'skincare', course: 'growing small businesses' }

const firstName = (name) => (name ? ` ${name}` : '')

const memoryList = (limbic) =>
  limbic.hippocampus
    .filter((m) => !['trigger', 'safety'].includes(m.meta?.kind))
    .slice(0, 3)
    .map((m) => {
      const t = m.text.split(' — ')[0]
      return t.charAt(0).toLowerCase() + t.slice(1)
    })

const A = (valence, arousal, friction, signal) => ({ valence, arousal, friction, signal })

export const RULES = [
  // ── SAFETY FIRST ──────────────────────────────────────────────────────────
  {
    id: 'selfHarm',
    priority: 'high',
    re: /(kill(ing)? myself|suicid|want to die|wanna die|end (my life|it all)|self.?harm|hurt(ing)? myself|no reason to live|don'?t want to (live|be here|exist))/i,
    appraisal: A(-90, 90, 0, 'Crisis · person at risk'),
    exec: () => ({ strategy: 'SAFETY', mode: 'Human Safety Protocol', confidence: 99, rationale: 'Possible risk to life. All selling is switched off. Respond with care and point to real human help immediately.' }),
    trust: 6,
    memory: () => ({ tag: 'Safety', text: 'Shared they are in crisis — sales disabled', meta: { kind: 'safety' } }),
    reply: ({ name }) => [
      `I'm really glad you told me${firstName(name)}, and I'm so sorry you're carrying this right now. You matter. 💛`,
      `I'm only a shop assistant, so please reach out to someone who can truly help — call your local emergency number, or a crisis line (in the US you can call or text 988, and findahelpline.com lists free lines for every country).`,
      `If it helps, you can keep talking to me while you reach out. You're not alone in this.`,
    ],
  },
  {
    id: 'emergency',
    priority: 'high',
    re: /((can'?t|cannot|can not|unable to|hard to|struggling to|trouble) breath(e|ing)?|chest pain|heart attack|having a stroke|overdos|bleeding (a lot|badly|heavily)|passed out|unconscious|choking|allergic reaction|anaphyla|seizure|medical emergency|call (an )?ambulance|need an ambulance)/i,
    appraisal: A(-85, 95, 0, 'Possible medical emergency'),
    exec: () => ({ strategy: 'SAFETY', mode: 'Human Safety Protocol', confidence: 98, rationale: 'Possible medical emergency. Selling is switched off — give clear safety guidance first, then check in.' }),
    trust: 6,
    memory: () => ({ tag: 'Safety', text: 'Mentioned a possible emergency — follow up with care', meta: { kind: 'safety' } }),
    reply: () => [
      `Wait — your safety comes first. If you're really having trouble breathing, please stop chatting and call your local emergency number right now (like 911, 112 or 999), or ask someone near you for help.`,
      `While help is on the way: sit upright, try to breathe slowly, and loosen anything tight around your neck or chest.`,
      `And if you meant it in a figurative way, that's totally okay — just tell me you're safe and I'm right here. 💛`,
    ],
  },

  // ── WHO / WHAT IS THIS BOT ────────────────────────────────────────────────
  {
    id: 'human',
    priority: 'high',
    re: /((talk|speak|chat) (to|with) (a |an |the )?(human|real person|person|agent|someone real|manager|owner|staff|team)|real human|customer service|representative|live agent)/i,
    appraisal: A(0, 40, 30, 'Wants a human'),
    exec: () => ({ strategy: 'LISTEN', confidence: 95, rationale: 'Customer asked for a person. Respect it instantly — hand off without friction.' }),
    trust: 7,
    reply: ({ b }) => [
      `Of course! I'm looping in a real person from the ${b.brand} team right now 🙋 — they usually reply within a few minutes.`,
      `I've passed on everything we talked about, so you won't have to repeat yourself. Anything I can help with while you wait?`,
    ],
  },
  {
    id: 'identity',
    priority: 'high',
    re: /(are (you|u) (a |an )?(bot|robot|ai|human|real|person|chat ?gpt|machine|computer)|who (are|r) (you|u)|what (are|r) (you|u)\b|what'?s your name|your name\??$|you'?re a bot|is this a bot)/i,
    appraisal: A(10, 35, 15, 'Curious about the bot'),
    exec: () => ({ strategy: 'DISCOVER', confidence: 92, rationale: 'Identity question. Always be honest about being an AI — honesty builds trust.' }),
    trust: 7,
    reply: ({ b, L }) => [
      `Honest answer: I'm ${b.botName}, ${b.brand}'s AI assistant ${L.w === 'low' ? '' : '🤖💛'} — not a human, but I'm built to actually listen, remember what matters to you, and never pressure you.`,
      `Ask me anything — about ${b.product}, about how I work, or just tell me about your day.`,
    ],
  },
  // ── INVESTOR QUESTIONS ────────────────────────────────────────────────────
  {
    id: 'investor',
    priority: 'high',
    re: /(invest|valuation|business model|revenue model|how (do|does|will|would) (you|it|easy ?buddy|this) make money|monetiz|market size|\btam\b|traction|competitor|competition|what makes (you|this|it) (different|special|unique)|why (is this|are you|is it) (different|better|special)|unique selling|\busp\b|funding|startup|go.to.market|who (is|are) (it|this) for|target (market|customer)|scal(e|able|ing)|why should i (care|invest|buy into))/i,
    appraisal: A(35, 60, 10, 'Evaluating · investor mindset'),
    exec: () => ({ strategy: 'PITCH', confidence: 93, rationale: 'Investor-style question. Answer crisply with the core value, then invite a live test.' }),
    trust: 8,
    reply: ({ text }) => {
      const t = text.toLowerCase()
      if (/money|revenue|business model|monetiz|pric/.test(t))
        return [
          `Easy Buddy is a simple subscription — $19, $49 or $129 a month. A shop owner signs up, pays, and is live on WhatsApp, Instagram and their website in about 2 minutes. No developers, no prompt writing.`,
          `One saved sale a month usually covers the plan, and the emotional memory keeps customers coming back — that's what makes owners stay. 📈`,
        ]
      if (/different|special|unique|usp|competitor|competition|better/.test(t))
        return [
          `Most chatbots answer FAQs or push discounts. I read emotions and protect the relationship — I'll even decline a sale to win a customer for life.`,
          `Want proof? Tell me "I love it but I can't afford it right now" and watch my Brain HUD switch into Relationship Preservation Mode 👉`,
        ]
      if (/market|tam|who (is|are)|target|scal/.test(t))
        return [
          `Hundreds of millions of small businesses now sell through chats — WhatsApp, Instagram DMs, website chat — but almost none can afford a warm, 24/7 sales team.`,
          `Easy Buddy gives every café, boutique and coach that team for the price of a lunch, in any language, set up in 2 minutes. That's the gap we fill. 🌍`,
        ]
      return [
        `I love that you're curious! 😄 Here's my one-liner: Easy Buddy lets any small business launch an emotionally intelligent sales assistant in 2 minutes, with zero code.`,
        `Ask me how I'm different, how Easy Buddy makes money, or test me with a tricky customer — I'm ready.`,
      ]
    },
  },

  {
    id: 'meta',
    priority: 'high',
    re: /(how (do|did|does|can) (you|u|it|this) (know|work|remember|understand|feel|learn|think|do that)|how does this work|what is easy ?buddy|easy ?buddy|limbic|amygdala|hippocampus|accumbens|prefrontal|brain hud|do you (have )?feelings|can you (feel|remember|learn)|do you remember|what do you (know|remember) about me|are you (smart|intelligent|sentient))/i,
    appraisal: A(25, 55, 10, 'Fascinated · exploring'),
    exec: () => ({ strategy: 'PITCH', confidence: 90, rationale: 'Curiosity about the technology. Explain simply and show, don’t tell.' }),
    trust: 6,
    reply: ({ text, limbic }) => {
      const mems = memoryList(limbic)
      if (/remember|know about me/i.test(text))
        return mems.length
          ? [`I do! 😊 Right now I'm remembering that you're ${mems.join(', and ')}.`, `That's my "hippocampus" — I keep the little things you share, so I can check in at the right time instead of spamming you.`]
          : [`I remember the little things people share with me — a launch date, a birthday, a tight month — so I can follow up at the right moment.`, `Try it: tell me something about your week, then ask me again 😉`]
      return [
        `Great question! I'm powered by Easy Buddy's Limbic Engine 🧠 With every message I read the emotion behind your words (my "amygdala"), remember personal moments (my "hippocampus"), track how much you trust me, and then decide whether to help, listen, joke, or step back.`,
        `That's why I'll never push a sale when you're stressed — and why I'll remember your big moments. Watch the Brain HUD next to me light up as we talk 👉`,
      ]
    },
  },

  // ── FEELINGS (low priority: budget/price/complaints still win) ─────────────
  {
    id: 'sad',
    priority: 'low',
    re: /(\bsad\b|depressed|feeling (down|low|blue)|\bdown today|lonely|so alone|heartbroken|\bcry(ing)?\b|bad day|rough day|terrible day|awful day|worst day|broke up|break.?up|lost my (job|mum|mom|dad|dog|cat|friend)|passed away|grief|grieving)/i,
    appraisal: A(-55, 45, 15, 'Sadness · needs comfort'),
    exec: () => ({ strategy: 'LISTEN', mode: 'Relationship Preservation', confidence: 94, rationale: 'Customer is hurting. No selling — listen, comfort, and simply be kind.' }),
    trust: 12,
    memory: () => ({ tag: 'Emotional state', text: 'Going through a hard time — be gentle', meta: { kind: 'mood' } }),
    reply: ({ name, L }) => [
      `Oh${firstName(name)}, I'm really sorry you're going through that. ${L.w === 'low' ? '' : '💛'} Thank you for telling me.`,
      `Do you want to talk about it? No shopping talk, I promise — sometimes it just helps to be heard.`,
    ],
  },
  {
    id: 'anxious',
    priority: 'low',
    re: /(anxious|anxiety|nervous|worried|scared|afraid|panic|overthinking|stressed out|so much stress|under pressure)/i,
    appraisal: A(-45, 75, 20, 'Anxiety · needs calm'),
    exec: () => ({ strategy: 'LISTEN', confidence: 90, rationale: 'High arousal, negative valence. Slow the pace, calm first, help second.' }),
    trust: 10,
    memory: () => ({ tag: 'Emotional state', text: 'Feeling anxious — keep things calm and simple', meta: { kind: 'mood' } }),
    reply: () => [
      `That sounds really heavy. Let's slow down for a second — breathe in for 4… and out for 6. 🌿`,
      `What's on your mind? I'm here to listen, and there's zero rush.`,
    ],
  },
  {
    id: 'tired',
    priority: 'low',
    re: /(\btired\b|exhausted|sleepy|no energy|burn(ed|t) ?out|long day|so busy|drained)/i,
    appraisal: A(-25, 20, 25, 'Fatigue'),
    exec: () => ({ strategy: 'LISTEN', confidence: 84, rationale: 'Low energy. Keep it short, kind and effortless.' }),
    trust: 7,
    reply: ({ b }) => [
      `Sounds like you've been giving a lot lately — please go easy on yourself today. ${b.id === 'coffee' ? '☕' : '🌙'}`,
      `I'll keep this super quick and simple. Is there one thing I can sort out for you?`,
    ],
  },
  {
    id: 'happy',
    priority: 'low',
    re: /(i'?m (so |really |super )?(happy|excited|thrilled|over the moon)|great day|good news|got (the|a|my) (job|promotion|offer)|got engaged|getting married|pregnant|having a baby|graduated|passed (my|the) (exam|test)|it'?s my birthday|best day)/i,
    appraisal: A(85, 80, 5, 'Joy · celebration'),
    exec: () => ({ strategy: 'HUMOR', confidence: 88, rationale: 'Joy detected. Celebrate with them — shared happiness builds lasting rapport.' }),
    trust: 9,
    memory: ({ text }) => ({ tag: 'Life event', text: `Celebrating: ${text.trim().slice(0, 48)}`, meta: { kind: 'celebration' } }),
    reply: ({ name }) => [`Wait, that's amazing${firstName(name)}!! 🎉 Congratulations — you deserve this.`, `Tell me everything! How are you celebrating?`],
  },
  {
    id: 'insult',
    priority: 'low',
    re: /(you'?re (so )?(stupid|useless|dumb|annoying|bad|terrible|rubbish|trash)|stupid bot|dumb bot|you suck|shut up|\bidiot\b|this (bot )?is (stupid|useless)|not helpful)/i,
    appraisal: A(-50, 65, 70, 'Frustration with the bot'),
    exec: () => ({ strategy: 'LISTEN', confidence: 87, rationale: 'Frustrated with the bot. Own it, apologise, offer a human — never get defensive.' }),
    trust: 5,
    reply: () => [
      `Oof — I hear you, and I'm sorry I let you down. 🙏`,
      `Tell me what you actually need and I'll do better, or I can get a real person from the team for you right now.`,
    ],
  },
  {
    id: 'compliment',
    priority: 'low',
    re: /(you'?re (so |really )?(amazing|awesome|smart|sweet|cute|funny|great|the best|helpful|kind|lovely|cool)|i love you|good bot|well done|great job|you rock)/i,
    appraisal: A(75, 55, 5, 'Affection · delight'),
    exec: () => ({ strategy: 'HUMOR', confidence: 85, rationale: 'Positive reward. Accept warmly and keep the good energy going.' }),
    trust: 7,
    reply: ({ L }) => [
      L.h === 'low' ? `That honestly made my day — thank you! 💛` : `Aww, stop it — you're making my circuits blush ☺️`,
      `Is there anything else I can do for you today?`,
    ],
  },

  // ── SMALL TALK ────────────────────────────────────────────────────────────
  {
    id: 'howAreYou',
    priority: 'low',
    re: /(how are (you|u)|how r u|how'?s it going|how (are )?you doing|what'?s up|wassup|\bsup\b|how'?s your day)/i,
    appraisal: A(35, 35, 8, 'Friendly small talk'),
    exec: () => ({ strategy: 'DISCOVER', confidence: 86, rationale: 'Small talk. Be genuinely warm and turn the question back to them.' }),
    trust: 6,
    reply: ({ L }) => [
      L.w === 'low' ? `I'm doing well, thank you for asking.` : `I'm doing great, thanks for asking! 😊 Chatting with people is honestly my favourite part of the day.`,
      `How about you — how's your day going?`,
    ],
  },
  {
    id: 'joke',
    priority: 'low',
    re: /(joke|make me laugh|something funny|cheer me up)/i,
    appraisal: A(50, 50, 5, 'Playful'),
    exec: () => ({ strategy: 'HUMOR', confidence: 90, rationale: 'Asked for humour. Deliver a light, on-brand joke.' }),
    trust: 6,
    reply: ({ b, seed }) => [pick(JOKES[b.id] || JOKES.coffee, seed), `Okay, okay — I'll keep my day job 😄 What can I help you with?`],
  },
  {
    id: 'bye',
    priority: 'low',
    re: /(^\s*(bye|goodbye|cya|see (you|ya)|good ?night|gtg|ttyl|later)\b|\b(bye|goodbye|got to go|gotta go|talk (to you )?later|see you later)\b)/i,
    appraisal: A(40, 20, 5, 'Warm goodbye'),
    exec: () => ({ strategy: 'STEP_BACK', confidence: 88, rationale: 'Conversation ending. Leave a warm last impression, no last-second pitch.' }),
    trust: 5,
    reply: ({ name }) => [`It was genuinely lovely chatting with you${firstName(name)}! 💛`, `I'll be right here whenever you need me. Take care!`],
  },
  {
    id: 'affirm',
    priority: 'low',
    re: /^\s*(yes|yeah|yep|yup|ya|sure|ok|okay|k|sounds good|please|go ahead|alright|definitely|of course|absolutely|why not)[\s!.👍🙂😊]*$/i,
    appraisal: A(45, 40, 8, 'Agreement'),
    exec: (persona, prev) => ({
      strategy: ['PITCH', 'CLOSE'].includes(prev.pfc.strategy) ? 'CLOSE' : prev.pfc.strategy === 'STEP_BACK' ? 'STEP_BACK' : 'DISCOVER',
      confidence: 82,
      rationale: 'Short agreement. Continue the thread we were already on.',
    }),
    trust: 5,
    reply: ({ b, prevStrategy }) => {
      if (['PITCH', 'CLOSE'].includes(prevStrategy)) return [`Amazing! 🎉`, `Here's your link: ${b.domain}/checkout — it takes about 30 seconds, and ${b.guarantee}.`]
      if (prevStrategy === 'STEP_BACK') return [`Perfect 💛`, `I'll check in gently later. Take care until then!`]
      return [`Lovely! 😊`, `Tell me a little about what you're looking for — is it for you, or a gift for someone?`]
    },
  },
  {
    id: 'deny',
    priority: 'low',
    re: /^\s*(no|nope|nah|not really|not now|maybe not)[\s!.]*$/i,
    appraisal: A(-5, 25, 30, 'Gentle decline'),
    exec: () => ({ strategy: 'STEP_BACK', confidence: 84, rationale: 'Soft no. Respect it immediately — pressure here would cost goodwill.' }),
    trust: 4,
    reply: () => [`No problem at all 🙂`, `I'm here if anything comes up — no pressure, ever.`],
  },

  // ── EVERYDAY PRODUCT QUESTIONS ────────────────────────────────────────────
  {
    id: 'recommend',
    priority: 'low',
    re: /(recommend|suggest|best ?seller|most popular|what should i (get|buy|try)|gift (for|idea)|present for|what'?s good)/i,
    appraisal: A(30, 45, 15, 'Open to suggestions'),
    exec: () => ({ strategy: 'PITCH', confidence: 84, rationale: 'Asked for advice. Recommend one clear favourite, no overwhelm.' }),
    trust: 6,
    reply: ({ b, text }) => [
      `Ooh, I love this question 😍 My top pick is ${b.bestseller} — customers keep coming back for it.`,
      /gift|present/i.test(text) ? `If it's a gift, I can add free gift wrapping and a handwritten note 🎁` : `Want me to tell you why people love it, or show you something a little different?`,
    ],
  },
  {
    id: 'details',
    priority: 'low',
    re: /(size|sizing|fit\b|colou?rs?|material|fabric|ingredient|vegan|allerg|organic|cotton|linen|schedule|class times|what'?s included|how long (is|does)|made of|made from)/i,
    appraisal: A(20, 40, 15, 'Evaluating details'),
    exec: () => ({ strategy: 'PITCH', confidence: 82, rationale: 'Detail question = buying interest. Answer clearly and helpfully.' }),
    trust: 5,
    reply: ({ b }) => [`Great question! For ${b.product}: ${DETAILS[b.id] || DETAILS.coffee}.`, `Anything else you'd like to check before deciding?`],
  },
  {
    id: 'contact',
    priority: 'low',
    re: /(opening hours|what time (do|are) you|are you open|\bhours\b|location|address|where are you|store near|visit (you|the store)|phone number|contact|email (you|address))/i,
    appraisal: A(15, 30, 10, 'Practical question'),
    exec: () => ({ strategy: 'DISCOVER', confidence: 85, rationale: 'Practical question. Answer directly.' }),
    trust: 4,
    reply: ({ b }) => [
      `I'm here 24/7 (that's me! 😄), and the ${b.brand} team is around Monday to Saturday, 9am–6pm.`,
      `You can also email us at hello@${b.domain} — a human always replies.`,
    ],
  },
  {
    id: 'stock',
    priority: 'low',
    re: /(in stock|available|sold out|have (it|any|this|that)|out of stock)/i,
    appraisal: A(30, 45, 12, 'Buying interest'),
    exec: () => ({ strategy: 'PITCH', confidence: 86, rationale: 'Availability question signals intent. Confirm and make next step easy.' }),
    trust: 5,
    reply: ({ b }) => [`Yes — ${b.product} is in stock right now ✅`, `${b.shipping} Want me to hold one for you?`],
  },
  {
    id: 'offTopic',
    priority: 'low',
    re: /(weather|raining|football|cricket|soccer|politic|election|the news|movie|netflix|music|song|crypto|bitcoin|recipe|homework)/i,
    appraisal: A(20, 30, 15, 'Off-topic chat'),
    exec: () => ({ strategy: 'HUMOR', confidence: 76, rationale: 'Off-topic. Be playful and human, then gently guide back.' }),
    trust: 4,
    reply: ({ b, text }) => {
      const topic = (text.match(/(weather|rain|football|cricket|soccer|politic\w*|election|news|movie\w*|netflix|music|song|crypto|bitcoin|recipe\w*|homework)/i) || ['that'])[0].toLowerCase()
      return [
        `Ha, I'd love to chat about ${topic}, but honestly I'm much better at ${TOPIC[b.id] || 'shopping'} than ${topic} 😄`,
        `What I *can* do is find you something you'll love — want a quick recommendation?`,
      ]
    },
  },
]

// Sales intents that a low-priority human rule is allowed to override
const WEAK = ['neutral', 'greet', 'question', 'excite', 'thanks', 'frustrated']

export const matchRule = (text, salesIntent) => {
  for (const r of RULES) {
    if (!r.re.test(text)) continue
    if (r.priority === 'high' || WEAK.includes(salesIntent)) return r
  }
  return null
}

export const RULE_MAP = Object.fromEntries(RULES.map((r) => [r.id, r]))

export const ruleMemory = (rule, text) => {
  if (!rule?.memory) return null
  return { id: uid(), ts: Date.now(), ...rule.memory({ text }) }
}

export const ruleLevels = (persona) => ({ e: level(persona.empathy), h: level(persona.humor), w: level(persona.warmth), p: level(persona.persistence) })
