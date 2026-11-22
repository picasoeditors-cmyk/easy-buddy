// "Demo Store Database" — 1,240 past chats, pre-aggregated for an instant, reliable pitch.
export const DEMO_ANALYTICS = {
  source: 'demo',
  totalChats: 1240,
  conversion: 18.4,
  avgResponse: 47,
  returnRate: 22,
  won: 228,
  lost: 1012,
  closed: [
    { name: 'Felt understood (empathy)', value: 34 },
    { name: 'Reply in under 2 minutes', value: 24 },
    { name: 'Personal recall', value: 19 },
    { name: 'Clear value framing', value: 14 },
    { name: 'Light humor', value: 9 },
  ],
  failed: [
    { name: 'Pushed price too early', value: 33 },
    { name: 'Robotic / scripted tone', value: 27 },
    { name: 'Ignored the objection', value: 22 },
    { name: 'Slow reply (> 10 min)', value: 12 },
    { name: 'No personal connection', value: 6 },
  ],
  phrases: [
    { text: '“I totally get it — let’s find what fits you.”', lift: 41 },
    { text: '“You mentioned your café — how’s the launch going?”', lift: 36 },
    { text: '“No pressure at all, I’ll be here whenever you’re ready.”', lift: 29 },
    { text: '“Most people find it pays for itself in 6 weeks.”', lift: 24 },
    { text: '“Browsing is my favourite hobby too 😄”', lift: 18 },
  ],
  timing: [
    { bucket: '<30s', rate: 31 },
    { bucket: '30s–2m', rate: 24 },
    { bucket: '2–10m', rate: 17 },
    { bucket: '10m–1h', rate: 9 },
    { bucket: '>1h', rate: 4 },
  ],
  dropoff: [
    { stage: 'Greeting', customers: 100 },
    { stage: 'Interest', customers: 71 },
    { stage: 'Price shown', customers: 43 },
    { stage: 'Objection', customers: 29 },
    { stage: 'Purchase', customers: 18 },
  ],
  hourly: Array.from({ length: 12 }, (_, i) => ({
    h: `${(i * 2).toString().padStart(2, '0')}:00`,
    chats: Math.round(40 + 70 * Math.sin(((i - 2) / 11) * Math.PI) ** 2 + (i % 3) * 6),
  })),
}

// Fine-tuning pipeline stages and log lines shown during "Optimize & Fine-Tune My Bot"
export const PIPELINE = [
  {
    key: 'clean',
    title: 'Data cleaning',
    desc: 'De-duplicate, strip PII, normalise channels',
    logs: ['Removing 37 duplicate threads…', 'Masking phone numbers & emails (PII)…', 'Normalising WhatsApp, IG and web chat formats…', '✓ 1,203 clean conversations ready'],
  },
  {
    key: 'extract',
    title: 'Behavioural pattern extraction',
    desc: 'Map emotional arcs to outcomes',
    logs: ['Scoring amygdala friction per turn…', 'Clustering 14 emotional arc archetypes…', 'Found: empathy-before-price closes 2.3× more', '✓ 312 winning micro-patterns extracted'],
  },
  {
    key: 'tune',
    title: 'Persona fine-tuning',
    desc: 'Calibrate tone, timing & strategy weights',
    logs: ['Raising empathy weight on price objections…', 'Delaying first price mention to turn 3+…', 'Enabling hippocampus recall on returning customers…', '✓ Persona weights updated'],
  },
  {
    key: 'project',
    title: 'Uplift projection',
    desc: 'Simulate 10,000 conversations',
    logs: ['Running 10,000 Monte-Carlo conversations…', 'Comparing against baseline persona…', '✓ Projection confidence: 92%'],
  },
]
