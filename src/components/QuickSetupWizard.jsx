import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Globe, Loader2, Sparkles, Timer, ChevronDown } from 'lucide-react'
import { Modal, Icon, Slider } from './ui'
import { useStore } from '../store/AppStore'
import { BUSINESSES, getBusiness, inferFromUrl } from '../data/businesses'
import { PERSONA_PRESETS, SLIDERS, sliderProps } from '../data/personas'
import { previewReply } from '../engine/preview'
import { CHANNELS } from './channels'
import { cn, sleep } from '../lib/utils'

const STEPS = ['Your business', 'Personality', 'Channels']

export default function QuickSetupWizard() {
  const { wizardOpen, closeWizard, business, businessId, selectBusiness, persona, setPersona, channels, setChannels, setPricingOpen, toast } = useStore()
  const [step, setStep] = useState(0)
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanLog, setScanLog] = useState([])
  const [presetId, setPresetId] = useState(null)
  const [tune, setTune] = useState(false)
  const [picked, setPicked] = useState({ whatsapp: true, web: true, instagram: false, email: true })
  const [seconds, setSeconds] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    if (!wizardOpen) return
    setStep(0)
    setSeconds(0)
    setScanLog([])
    setPicked({ whatsapp: true, web: true, instagram: channels.instagram, email: true })
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardOpen])

  const scan = async () => {
    if (!url.trim()) return
    setScanning(true)
    setScanLog([])
    const found = inferFromUrl(url)
    const preset = getBusiness(found.id)
    const lines = [
      `Reading ${found.domain}…`,
      `Found ${18 + (found.domain.length % 20)} products & a pricing page`,
      `Detected category: ${preset.label}`,
      `Learned brand voice: friendly, ${found.id === 'course' ? 'expert' : 'casual'}`,
      '✓ Knowledge base built',
    ]
    for (const l of lines) {
      await sleep(520)
      setScanLog((s) => [...s, l])
    }
    selectBusiness(found.id, { brand: found.brand, domain: found.domain, freeLink: `${found.domain}/${preset.freeLink.split('/')[1]}` })
    setScanning(false)
    toast(`Imported ${found.brand} — your buddy already knows your products`, 'success')
  }

  const preview = useMemo(() => previewReply(persona, business), [persona, business])

  const finish = () => {
    setChannels(picked)
    clearInterval(timer.current)
    closeWizard()
    toast(`Set up in ${seconds}s. One last step: activate your plan.`, 'success')
    setTimeout(() => setPricingOpen(true), 350)
  }

  const canNext = step !== 1 || true

  return (
    <Modal open={wizardOpen} onClose={closeWizard} width="max-w-3xl">
      <div className="flex flex-col">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div>
              <span className="chip bg-coral-50 text-coral-600">
                <Sparkles size={12} /> Zero-Code Quick Setup
              </span>
              <h2 className="mt-2 text-2xl font-extrabold">Let’s build your AI sales buddy</h2>
            </div>
            <div className="chip bg-slate-100 font-mono text-sm text-slate-700">
              <Timer size={14} /> 00:{String(Math.min(seconds, 99)).padStart(2, '0')} <span className="font-sans text-xs text-slate-400">/ 60s</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-coral-500" initial={false} animate={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} />
                </div>
                <div className={cn('mt-1.5 text-xs font-semibold', i <= step ? 'text-slate-800' : 'text-slate-400')}>
                  {i + 1}. {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[380px] px-6 py-6 sm:px-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <h3 className="font-bold">What kind of business do you run?</h3>
                <p className="text-sm text-slate-500">Pick one — or paste your website and we’ll learn everything for you.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {BUSINESSES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => selectBusiness(b.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition',
                        businessId === b.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${b.accent}15`, color: b.accent }}>
                        <Icon name={b.icon} size={20} />
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{b.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <div className="h-px flex-1 bg-slate-100" /> or connect your site <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && scan()}
                      placeholder="www.yourshop.com"
                      className="input pl-10"
                    />
                  </div>
                  <button onClick={scan} disabled={scanning || !url.trim()} className="btn-primary">
                    {scanning ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Scan
                  </button>
                </div>
                {scanLog.length > 0 && (
                  <div className="mt-3 space-y-1 rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">
                    {scanLog.map((l) => (
                      <motion.div key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                        {l}
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Your buddy: <b>{business.botName}</b> from <b>{business.brand}</b>, selling <b>{business.product}</b>.
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <h3 className="font-bold">How should {business.botName} make customers feel?</h3>
                <p className="text-sm text-slate-500">Pick a personality. You can fine-tune anytime.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PERSONA_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPresetId(p.id)
                        setPersona(p.values)
                      }}
                      className={cn('rounded-2xl border-2 p-3.5 text-left transition', presetId === p.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300')}
                    >
                      <div className="text-2xl">{p.emoji}</div>
                      <div className="mt-1.5 text-sm font-bold text-slate-800">{p.name}</div>
                      <div className="mt-0.5 text-xs leading-snug text-slate-500">{p.blurb}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setTune((t) => !t)} className="btn mt-3 -ml-2 px-2 text-xs text-indigo-600">
                  <ChevronDown size={14} className={cn('transition', tune && 'rotate-180')} /> Fine-tune with sliders
                </button>
                <AnimatePresence>
                  {tune && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid gap-5 pb-2 pt-2 sm:grid-cols-2">
                        {SLIDERS.map((s) => (
                          <Slider key={s.key} {...sliderProps(s)} value={persona[s.key]} onChange={(v) => { setPresetId(null); setPersona((p) => ({ ...p, [s.key]: v })) }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mt-3 rounded-2xl bg-[#efeae2] p-3">
                  <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-sm text-slate-800 shadow-sm">
                    This looks cool, but it’s a bit out of my budget right now
                  </div>
                  <motion.div key={preview.bubbles[0]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 w-fit max-w-[90%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
                    {preview.bubbles.join(' ')}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <h3 className="font-bold">Where do your customers talk to you?</h3>
                <p className="text-sm text-slate-500">One tap each. We handle the technical bits.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CHANNELS.map((c) => {
                    const on = picked[c.id]
                    return (
                      <button
                        key={c.id}
                        onClick={() => setPicked((p) => ({ ...p, [c.id]: !p[c.id] }))}
                        className={cn('flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition', on ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300')}
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: c.gradient }}>
                          <Icon name={c.icon} size={20} />
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.short}</div>
                        </div>
                        <span className={cn('grid h-6 w-6 place-items-center rounded-full border-2 transition', on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>
                          {on && <Check size={14} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-coral-50 p-4 text-sm text-slate-700">
                  ✨ <b>{business.botName}</b> will greet customers on{' '}
                  <b>{Object.values(picked).filter(Boolean).length || 'no'}</b> channel(s), remember them, and follow up by email — automatically.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 sm:px-8">
          <button onClick={() => (step === 0 ? closeWizard() : setStep((s) => s - 1))} className="btn-ghost">
            {step === 0 ? 'Skip for now' : (<><ArrowLeft size={15} /> Back</>)}
          </button>
          {step < 2 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-indigo px-6">
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={finish} disabled={!Object.values(picked).some(Boolean)} className="btn-emerald px-6">
              Launch my buddy <Sparkles size={15} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
