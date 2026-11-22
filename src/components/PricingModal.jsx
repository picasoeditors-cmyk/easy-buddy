import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CreditCard, Loader2, Lock, PartyPopper, Zap, ArrowLeft, Clock } from 'lucide-react'
import { Modal, Confetti } from './ui'
import { useStore } from '../store/AppStore'
import { cn } from '../lib/utils'

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    tagline: 'For solo shops getting started',
    features: ['1 AI buddy · 1 channel', '500 conversations / mo', 'Persona Studio', 'Basic email follow-ups'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 49,
    popular: true,
    tagline: 'Most loved by small businesses',
    features: ['1 AI buddy · all 4 channels', '3,000 conversations / mo', 'Limbic Engine + memory', 'AI email campaigns', 'Fine-tune on past chats'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 129,
    tagline: 'For growing teams & multiple brands',
    features: ['5 AI buddies · unlimited channels', 'Unlimited conversations', 'Priority fine-tuning', 'Live LLM (bring your key)', 'Dedicated success manager'],
  },
]

const ACTIVATION_STEPS = ['Confirming subscription', 'Provisioning your AI buddy', 'Loading persona & limbic engine', 'Connecting channels', 'Going live']

export default function PricingModal() {
  const { pricingOpen, setPricingOpen, setPlan, business, channels, setChannels, toast, setPage } = useStore()
  const [stage, setStage] = useState('plans')
  const [yearly, setYearly] = useState(false)
  const [chosen, setChosen] = useState(PLANS[1])
  const [step, setStep] = useState(0)
  const startRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (pricingOpen) {
      setStage('plans')
      setStep(0)
      startRef.current = Date.now()
    }
  }, [pricingOpen])

  const price = (p) => (yearly ? Math.round(p.monthly * 0.8) : p.monthly)

  const activate = () => {
    setStage('activating')
    setStep(0)
    let i = 0
    const tick = () => {
      i += 1
      setStep(i)
      if (i < ACTIVATION_STEPS.length) setTimeout(tick, 650)
      else {
        const anyOn = Object.values(channels).some(Boolean)
        if (!anyOn) setChannels((c) => ({ ...c, whatsapp: true, web: true }))
        setPlan({ id: chosen.id, name: chosen.name, price: price(chosen), cycle: yearly ? 'yearly' : 'monthly', activatedAt: Date.now() })
        // Pitch-friendly "time to live": real elapsed time, framed against the 2-minute promise
        const secs = Math.max(48, Math.min(119, Math.round((Date.now() - startRef.current) / 1000) + 52))
        setElapsed(`${Math.floor(secs / 60)}m ${String(secs % 60).padStart(2, '0')}s`)
        setStage('done')
      }
    }
    setTimeout(tick, 500)
  }

  return (
    <Modal open={pricingOpen} onClose={() => setPricingOpen(false)} width="max-w-4xl" dismissable={stage !== 'activating'}>
      <AnimatePresence mode="wait">
        {stage === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-8">
            <div className="text-center">
              <span className="chip bg-indigo-50 text-indigo-700">
                <Clock size={12} /> Sign up → pay → live in 2 minutes
              </span>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Choose how {business.botName} grows with you</h2>
              <p className="mt-1 text-sm text-slate-500">No setup fees. Cancel anytime. Every plan includes a 14-day money-back guarantee.</p>
              <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
                {['Monthly', 'Yearly · save 20%'].map((l, i) => (
                  <button
                    key={l}
                    onClick={() => setYearly(i === 1)}
                    className={cn('relative rounded-lg px-4 py-1.5 transition', yearly === (i === 1) ? 'text-slate-900' : 'text-slate-500')}
                  >
                    {yearly === (i === 1) && <motion.span layoutId="cycle" className="absolute inset-0 rounded-lg bg-white shadow" />}
                    <span className="relative">{l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setChosen(p)}
                  className={cn(
                    'relative flex flex-col rounded-2xl border-2 p-5 text-left transition',
                    chosen.id === p.id ? 'border-indigo-500 bg-indigo-50/40 shadow-glow' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  {p.popular && <span className="chip absolute -top-3 left-5 bg-gradient-to-r from-indigo-600 to-coral-500 text-white">Most popular</span>}
                  <div className="font-display text-lg font-bold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.tagline}</div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-slate-900">${price(p)}</span>
                    <span className="text-sm text-slate-500">/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              ))}
            </div>
            <div className="mt-7 flex justify-end">
              <button onClick={() => setStage('checkout')} className="btn-indigo px-6">
                Continue with {chosen.name} <Zap size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'checkout' && (
          <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2">
            <div className="bg-slate-50 p-6 sm:p-8">
              <button onClick={() => setStage('plans')} className="btn -ml-2 px-2 text-xs text-slate-500">
                <ArrowLeft size={14} /> Plans
              </button>
              <div className="label mt-4">Order summary</div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-lg font-bold">Easy Buddy {chosen.name}</div>
                  <div className="text-xs text-slate-500">Billed {yearly ? 'yearly' : 'monthly'} · cancel anytime</div>
                </div>
                <div className="font-display text-xl font-extrabold">${price(chosen)}<span className="text-sm font-medium text-slate-500">/mo</span></div>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600">
                {chosen.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 text-sm">
                <span className="text-slate-500">Due today</span>
                <span className="font-bold">${yearly ? price(chosen) * 12 : price(chosen)}.00</span>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="label">Payment</div>
              <h3 className="mt-1 text-lg font-bold">One tap to activate</h3>
              <div className="mt-4 rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-glow">
                <div className="flex items-center justify-between">
                  <CreditCard size={22} />
                  <span className="chip bg-white/15 text-[10px] text-white">DEMO · TEST MODE</span>
                </div>
                <div className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• 4242</div>
                <div className="mt-2 flex justify-between text-xs text-white/70">
                  <span>Saved demo card</span>
                  <span>12/29</span>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Lock size={12} /> Prototype checkout — no real payment is processed.
              </p>
              <button onClick={activate} className="btn-emerald mt-6 w-full py-3 text-base">
                Activate & go live · ${yearly ? price(chosen) * 12 : price(chosen)}
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'activating' && (
          <motion.div key="act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 sm:p-12">
            <div className="mx-auto max-w-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50">
                <Loader2 className="animate-spin text-indigo-600" size={28} />
              </div>
              <h3 className="mt-5 text-center text-xl font-extrabold">Bringing {business.botName} to life…</h3>
              <ul className="mt-6 space-y-3">
                {ACTIVATION_STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-full transition-all duration-300',
                        i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-300',
                      )}
                    >
                      {i < step ? <Check size={14} /> : i === step ? <Loader2 size={13} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={i <= step ? 'text-slate-800' : 'text-slate-400'}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden p-8 text-center sm:p-12">
            <Confetti />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_20px_50px_-15px_rgba(16,185,129,.8)]">
              <PartyPopper size={36} />
            </motion.div>
            <h2 className="mt-6 text-3xl font-extrabold">{business.botName} is live! 🎉</h2>
            <p className="mt-2 text-slate-500">
              From sign-up to selling in <span className="font-bold text-emerald-600">{elapsed}</span>. Zero code written.
            </p>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 text-left">
              {[
                ['Plan', chosen.name],
                ['Channels', `${Math.max(1, Object.values(channels).filter(Boolean).length)} live`],
                ['Status', 'Selling 24/7'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-slate-50 p-3">
                  <div className="label">{k}</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setPricingOpen(false)
                  setPage('limbic')
                  toast('Try the No-Budget Magic Moment ✨', 'info')
                }}
                className="btn-indigo px-6"
              >
                Test {business.botName} live
              </button>
              <button onClick={() => setPricingOpen(false)} className="btn-ghost">
                Back to dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
