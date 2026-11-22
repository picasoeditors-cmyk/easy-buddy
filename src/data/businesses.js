// Business presets. Every chatbot reply, email and preview is assembled from these fields,
// so switching the business type instantly re-skins the whole demo.
export const BUSINESSES = [
  {
    id: 'coffee',
    label: 'Coffee Roastery',
    icon: 'Coffee',
    brand: 'Brew & Bloom Coffee',
    domain: 'brewandbloom.co',
    botName: 'Mia',
    product: 'the Barista Starter Kit',
    price: 149,
    lite: 'our Single-Origin Sampler ($39)',
    valueProp: 'it replaces about 60 café visits — most people say it pays for itself in 6 weeks',
    bestseller: 'the Ethiopian Yirgacheffe roast',
    addon: 'our hand-thrown ceramic cup',
    bundleSave: '$18',
    freebie: 'Home Barista Masterclass (a 12-minute video)',
    freeLink: 'brewandbloom.co/masterclass',
    guarantee: 'every order has a 30-day "love it or it\'s free" guarantee',
    proof: '4,800+ five-star reviews, and every bag is roasted within 48 hours of shipping',
    shipping: 'We ship within 24h and delivery usually takes 2–3 days.',
    accent: '#b45309',
  },
  {
    id: 'boutique',
    label: 'Fashion Boutique',
    icon: 'Shirt',
    brand: 'Linen & Lane',
    domain: 'linenandlane.com',
    botName: 'Ava',
    product: 'the Weekend Linen Set',
    price: 128,
    lite: 'our Linen Essentials Tee ($38)',
    valueProp: 'it\'s the piece customers tell us they wear 3–4 times a week, for years',
    bestseller: 'the Sage Wrap Dress',
    addon: 'our woven market tote',
    bundleSave: '$22',
    freebie: 'Capsule Wardrobe Planner (printable PDF)',
    freeLink: 'linenandlane.com/capsule-guide',
    guarantee: 'free returns and exchanges for 60 days',
    proof: 'over 12,000 happy customers and a 4.9★ fit rating',
    shipping: 'Orders ship same-day before 2pm, with free delivery over $75.',
    accent: '#0f766e',
  },
  {
    id: 'fitness',
    label: 'Fitness Studio',
    icon: 'Dumbbell',
    brand: 'Pulse Studio',
    domain: 'pulsestudio.fit',
    botName: 'Jay',
    product: 'the Unlimited Monthly Membership',
    price: 89,
    lite: 'our 4-Class Pass ($45)',
    valueProp: 'members average 3 classes a week, which works out to about $7 a class',
    bestseller: 'the Sunrise Reformer class',
    addon: 'a personal form-check session',
    bundleSave: '$30',
    freebie: '7-Day At-Home Starter Plan',
    freeLink: 'pulsestudio.fit/starter-plan',
    guarantee: 'you can pause or cancel anytime — no contracts, ever',
    proof: '96% of members are still with us after 3 months',
    shipping: 'You can book your first class instantly in our app.',
    accent: '#7c3aed',
  },
  {
    id: 'skincare',
    label: 'Skincare Brand',
    icon: 'Flower2',
    brand: 'Aura Skin',
    domain: 'auraskin.co',
    botName: 'Luna',
    product: 'the Glow Ritual Set',
    price: 96,
    lite: 'our Hydra Mist travel size ($24)',
    valueProp: 'it\'s a 3-month supply, so it works out to about $1 a day',
    bestseller: 'the Vitamin C Dew Serum',
    addon: 'our silk sleep scrunchie',
    bundleSave: '$15',
    freebie: 'Personal Skin-Type Quiz & Routine Card',
    freeLink: 'auraskin.co/skin-quiz',
    guarantee: 'a 45-day "happy skin" money-back guarantee',
    proof: 'dermatologist-tested, vegan, and loved by 30,000+ customers',
    shipping: 'Free carbon-neutral shipping, usually 2–4 days.',
    accent: '#db2777',
  },
  {
    id: 'course',
    label: 'Online Coaching',
    icon: 'GraduationCap',
    brand: 'Bright Path Academy',
    domain: 'brightpath.academy',
    botName: 'Noah',
    product: 'the 6-Week Small Business Growth Program',
    price: 249,
    lite: 'our self-paced Starter Workshop ($49)',
    valueProp: 'graduates report an average 31% revenue lift within 90 days',
    bestseller: 'the Pricing Confidence module',
    addon: 'a 1:1 strategy call',
    bundleSave: '$60',
    freebie: 'Free 30-minute Cash-Flow Masterclass',
    freeLink: 'brightpath.academy/cashflow',
    guarantee: 'a full refund within 14 days, no questions asked',
    proof: '2,300+ graduates and a 4.8★ average rating',
    shipping: 'You get instant access the moment you enrol.',
    accent: '#2563eb',
  },
]

export const getBusiness = (id) => BUSINESSES.find((b) => b.id === id) || BUSINESSES[0]

// Infer a business preset + brand name from a pasted website URL (simulated site scan).
export const inferFromUrl = (url) => {
  const clean = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
  const host = clean.split('/')[0] || 'mybusiness.com'
  const name = host.split('.')[0]
  const rules = [
    [/coffee|cafe|roast|brew|bean|espresso/, 'coffee'],
    [/fit|gym|yoga|pilates|studio|train/, 'fitness'],
    [/skin|beauty|glow|cosmetic|spa|aura/, 'skincare'],
    [/learn|course|academy|coach|school|class/, 'course'],
    [/shop|wear|fashion|style|boutique|lane|linen|apparel/, 'boutique'],
  ]
  const match = rules.find(([re]) => re.test(host))
  const id = match ? match[1] : 'coffee'
  const brand = name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
  return { id, brand: brand || 'My Business', domain: host }
}
