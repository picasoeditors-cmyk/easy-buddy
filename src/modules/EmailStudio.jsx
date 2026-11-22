import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookHeart, Brain, CalendarDays, Check, Copy, Loader2, Mail, RefreshCw, Send, Sparkles, Star, Inbox, Wand } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { generateCampaign, deriveCustomerName, campaignToText } from '../engine/emails'
import { llmCampaign } from '../engine/llm'
import { extractMemories, initialLimbic } from '../engine/limbic'
import { cn, sleep } from '../lib/utils'

const GEN_STEPS = ['Reading hippocampus memory notes', 'Calibrating tone to persona sliders', 'Writing Day 1 · warm check-in', 'Writing Day 14 · value share', 'Writing Day 30 · gentle return offer']

const SAMPLE_LINES = [
  "Hi! I'm opening a little bakery next month",
  "Cash is really tight until Q2, I can't afford it right now",
]

export default function EmailStudio() {
  const { business, persona, limbic, setLimbic, campaign, setCampaign, liveLLM, settings, toast, setPage } = useStore()
  const memories = limbic.hippocampus.filter((m) => m.meta?.kind !== 'trigger')
  const [name, setName] = useState(() => deriveCustomerName(limbic.hippocampus) || 'Sam')
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(-1)
  const [active, setActive] = useState(0)
  const [variant, setVariant] = useState(0)
  const [scheduled, setScheduled] = useState(false)

  useEffect(() => {
    const n = deriveCustomerName(limbic.hippocampus)
    if (n) setName(n)
  }, [limbic.hippocampus])

  const loadSample = () => {
    let mems = []
    SAMPLE_LINES.forEach((l) => {
      mems = [...extractMemories(l, mems), ...mems]
    })
    setLimbic({ ...initialLimbic(), hippocampus: mems })
    toast('Loaded memory notes from the No-Budget scenario', 'info')
  }

  const generate = async (nextVariant = variant) => {
    setGenerating(true)
    setScheduled(false)
    setGenStep(0)
    const local = () => generateCampaign({ business, persona, memories, limbic, customerName: name, variant: nextVariant })
    let result
    const livePromise = liveLLM ? llmCampaign({ settings, business, persona, memories, customerName: name }).catch((e) => e) : null
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i)
      await sleep(liveLLM ? 600 : 480)
    }
    if (livePromise) {
      const out = await livePromise
      if (out instanceof Error || !Array.isArray(out)) {
        toast(`Live LLM unavailable — used Instant Demo writer`, 'warn')
        result = local()
      } else result = out
    } else result = local()
    setGenStep(GEN_STEPS.length)
    setCampaign(result)
    setActive(0)
    setGenerating(false)
  }

  const email = campaign?.[active]

  return (
    <div className="grid gap-6 pt-4 xl:grid-cols-[360px_1fr]">
      {/* Left: memory + controls */}
      <div className="space-y-5">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <BookHeart size={17} className="text-amber-500" />
            <h3 className="font-bold">Hippocampus memory notes</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Collected automatically from the live chat. Every email will weave these in naturally.</p>
          <div className="mt-4 space-y-2">
            {memories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                <div className="text-sm text-slate-500">No memories yet.</div>
                <div className="mt-3 flex flex-col gap-2">
                  <button onClick={() => setPage('limbic')} className="btn-ghost py-2 text-xs">
                    <Brain size={14} /> Chat in the simulator
                  </button>
                  <button onClick={loadSample} className="btn py-2 text-xs text-indigo-600 hover:bg-indigo-50">
                    <Wand size={14} /> Load sample memories
                  </button>
                </div>
              </div>
            ) : (
              memories.map((m) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl bg-amber-50/60 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{m.tag}</div>
                  <div className="text-sm font-medium text-slate-700">{m.text}</div>
                </motion.div>
              ))
            )}
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Customer first name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Sam" />
          </label>
          <button onClick={() => generate()} disabled={generating} className="btn-indigo mt-4 w-full py-3">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {campaign ? 'Regenerate campaign' : 'Generate Follow-Up Email Campaign'}
          </button>
          <div className="mt-2 text-center text-[11px] text-slate-400">{liveLLM ? 'Writing with your live LLM' : 'Instant Demo writer · works offline'}</div>
        </div>

        {campaign && (
          <div className="card p-5">
            <div className="label mb-3">Sequence timeline</div>
            <div className="relative space-y-1">
              <div className="absolute bottom-5 left-[15px] top-5 w-0.5 bg-slate-100" />
              {campaign.map((e, i) => (
                <button key={e.day} onClick={() => setActive(i)} className={cn('relative flex w-full items-start gap-3 rounded-2xl p-2.5 text-left transition', active === i ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
                  <span className={cn('relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold', active === i ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-2 ring-slate-100')}>D{e.day}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      Day {e.day} · {e.label}
                    </div>
                    <div className="truncate text-xs text-slate-500">{e.subject}</div>
                    <div className="mt-1 text-[10px] font-semibold text-emerald-600">Predicted open rate {e.openRate}%</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: preview */}
      <div>
        <AnimatePresence mode="wait">
          {generating && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card grid min-h-[560px] place-items-center p-8">
              <div className="w-full max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-coral-500 text-white shadow-glow">
                  <Mail size={26} />
                </div>
                <h3 className="mt-5 text-center text-lg font-extrabold">Writing emails that feel human…</h3>
                <ul className="mt-6 space-y-3">
                  {GEN_STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 text-sm">
                      <span className={cn('grid h-6 w-6 place-items-center rounded-full', i < genStep ? 'bg-emerald-500 text-white' : i === genStep ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-300')}>
                        {i < genStep ? <Check size={13} /> : i === genStep ? <Loader2 size={12} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      <span className={i <= genStep ? 'text-slate-800' : 'text-slate-400'}>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {!generating && !campaign && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card grid min-h-[560px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <Inbox size={28} />
                </div>
                <h3 className="mt-4 text-lg font-extrabold">Your follow-up sequence appears here</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Day 1 warm check-in → Day 14 value share → Day 30 gentle return offer. Personalised from the conversation’s emotional memory.
                </p>
              </div>
            </motion.div>
          )}

          {!generating && email && (
            <motion.div key={`email-${active}-${email.subject}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card overflow-hidden">
              {/* Mail client chrome */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-coral-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-2 flex gap-1">
                  {campaign.map((e, i) => (
                    <button key={e.day} onClick={() => setActive(i)} className={cn('rounded-lg px-3 py-1 text-xs font-semibold transition', active === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                      Day {e.day}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(campaignToText(campaign))
                      toast('Full sequence copied to clipboard', 'success')
                    }}
                    className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-600"
                  >
                    <Copy size={13} /> Copy all
                  </button>
                  <button
                    onClick={() => {
                      const v = variant + 1
                      setVariant(v)
                      generate(v)
                    }}
                    className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-600"
                  >
                    <RefreshCw size={13} /> New variation
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-coral-300 font-bold text-white">{business.botName[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{business.botName} at {business.brand}</span>
                      <span className="text-xs text-slate-400">&lt;hello@{business.domain}&gt;</span>
                      <Star size={14} className="ml-auto text-amber-400" fill="currentColor" />
                    </div>
                    <div className="text-xs text-slate-500">to {name || 'customer'} · sends on Day {email.day}</div>
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-extrabold leading-snug">{email.subject}</h2>
                <div className="mt-1 text-sm text-slate-400">{email.preview}</div>
              </div>

              <div className="bg-slate-50/60 px-4 py-6 sm:px-10">
                <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg" style={{ background: business.accent }} />
                    <span className="font-display text-sm font-extrabold" style={{ color: business.accent }}>
                      {business.brand}
                    </span>
                  </div>
                  <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                    {email.body.map((p, i) => (
                      <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                        {p}
                      </motion.p>
                    ))}
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-slate-800">{email.signature}</div>
                  <a
                    href={email.cta.href}
                    onClick={(e) => e.preventDefault()}
                    className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md"
                    style={{ background: business.accent }}
                  >
                    {email.cta.label}
                  </a>
                  <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
                    You’re receiving this because you chatted with {business.brand}. Unsubscribe anytime — no hard feelings.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-4">
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} /> Day {email.day}
                  </span>
                  <span>
                    Goal: <b className="text-slate-700">{email.goal}</b>
                  </span>
                  <span>
                    Predicted open: <b className="text-emerald-600">{email.openRate}%</b>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setScheduled(true)
                    toast(`3-email sequence scheduled for ${name || 'this customer'} (demo)`, 'success')
                  }}
                  disabled={scheduled}
                  className={cn('ml-auto', scheduled ? 'btn bg-emerald-50 text-emerald-700' : 'btn-emerald')}
                >
                  {scheduled ? (<><Check size={15} /> Sequence scheduled</>) : (<><Send size={15} /> Schedule sequence</>)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
