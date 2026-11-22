export const DEFAULT_PERSONA = { empathy: 78, humor: 42, warmth: 82, persistence: 30 }

export const PERSONA_PRESETS = [
  {
    id: 'friend',
    name: 'Warm Friend',
    emoji: '🤗',
    blurb: 'Kind, caring, never pushy. Customers feel like they know you.',
    values: { empathy: 88, humor: 45, warmth: 92, persistence: 22 },
  },
  {
    id: 'witty',
    name: 'Witty Concierge',
    emoji: '😄',
    blurb: 'Playful and charming. Turns small talk into sales.',
    values: { empathy: 62, humor: 90, warmth: 76, persistence: 45 },
  },
  {
    id: 'consultant',
    name: 'Calm Consultant',
    emoji: '🧘',
    blurb: 'Patient expert. Listens first, advises second.',
    values: { empathy: 80, humor: 18, warmth: 64, persistence: 12 },
  },
  {
    id: 'closer',
    name: 'Confident Closer',
    emoji: '🚀',
    blurb: 'Direct and persuasive. Great for flash sales.',
    values: { empathy: 38, humor: 30, warmth: 55, persistence: 92 },
  },
]

export const SLIDERS = [
  {
    key: 'empathy',
    label: 'Emotional Depth',
    hint: 'How deeply it notices and validates feelings',
    left: 'Matter-of-fact',
    right: 'Deeply empathetic',
    icon: 'Heart',
    color: '#f9694a',
  },
  {
    key: 'humor',
    label: 'Humor & Wit',
    hint: 'How often it lightens the mood',
    left: 'Serious',
    right: 'Playful',
    icon: 'Smile',
    color: '#f59e0b',
  },
  {
    key: 'warmth',
    label: 'Warmth & Friendliness',
    hint: 'How personal and cosy it sounds',
    left: 'Professional',
    right: 'Like a best friend',
    icon: 'Sun',
    color: '#ec4899',
  },
  {
    key: 'persistence',
    label: 'Sales Style',
    hint: 'Patient advisor or persistent closer',
    left: 'Consultative patience',
    right: 'Sales persistence',
    icon: 'Target',
    color: '#6366f1',
  },
]

// Slider definitions carry a `key` field (the persona property); strip it before spreading into JSX
export const sliderProps = ({ key: _key, ...rest }) => rest
