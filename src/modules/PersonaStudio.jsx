import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCheck, RotateCcw, Wand2 } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { useStore } from '../store/AppStore'
import { PERSONA_PRESETS, SLIDERS, DEFAULT_PERSONA, sliderProps } from '../data/personas'
import { previewReply, PREVIEW_PROMPT } from '../engine/preview'
import { Slider } from '../components/ui'
import { cn } from '../lib/utils'

const Meter = ({ label, value, color, hint }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${value}%` }} transition={{ type: 'spring', stiffness: 140, damping: 20 }} />
    </div>
    {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
  </div>
)

export default function PersonaStudio() {
  const { persona, setPersona, business, setPage, toast } = useStore()
  const [lastChanged, setLastChanged] = useState(null)
  const changeTimer = useRef(null)
  const preview = useMemo(() => previewReply(persona, business), [persona, business])
  const activePreset = PERSONA_PRESETS.find((p) => SLIDERS.every((s) => p.values[s.key] === persona[s.key]))

  const radar = SLIDERS.map((s) => ({ k: s.label.split(' ')[0], v: persona[s.key] }))

  const update = (key, v) => {
    setPersona((p) => ({ ...p, [key]: v }))
    setLastChanged(key)
    clearTimeout(changeTimer.current)
    changeTimer.current = setTimeout(() => setLastChanged(null), 1400)
  }

  return (
    <div className="grid gap-6 pt-4 xl:grid-cols-[1fr_440px]">
      <div className="space-y-6">
        <section className="card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label">Quick presets</div>
              <h3 className="text-lg font-bold">Start from a personality</h3>
            </div>
            <button
              onClick={() => {
                setPersona(DEFAULT_PERSONA)
                toast('Persona reset to default', 'info')
              }}
              className="btn-ghost py-2 text-xs"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {PERSONA_PRESETS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPersona(p.values)}
                className={cn('rounded-2xl border-2 p-4 text-left transition', activePreset?.id === p.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300')}
              >
                <div className="text-2xl">{p.emoji}</div>
                <div className="mt-1.5 text-sm font-bold">{p.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-slate-500">{p.blurb}</div>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="label">Emotional calibration</div>
          <h3 className="text-lg font-bold">Drag to shape how {business.botName} feels</h3>
          <p className="text-sm text-slate-500">No prompts, no settings jargon. Just how you want customers to feel.</p>
          <div className="mt-6 grid gap-7 md:grid-cols-2">
            {SLIDERS.map((s) => (
              <div key={s.key} className={cn('rounded-2xl p-3 transition', lastChanged === s.key && 'bg-slate-50 ring-1 ring-slate-200')}>
                <Slider {...sliderProps(s)} value={persona[s.key]} onChange={(v) => update(s.key, v)} />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <div className="label">Tone fingerprint</div>
            <div className="mt-2 h-56">
              <ResponsiveContainer>
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Radar dataKey="v" stroke="#6366f1" fill="#6366f1" fillOpacity={0.22} strokeWidth={2} isAnimationActive animationDuration={400} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preview.tone.map((t) => (
                <span key={t} className="chip bg-slate-100 text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="label">Outcome forecast</div>
            <h4 className="mt-1 font-bold">For a budget-conscious customer</h4>
            <div className="mt-5 space-y-5">
              <Meter label="Trust after reply" value={preview.forecast.trust} color="#10b981" hint="How safe and understood they feel" />
              <Meter label="Closes today" value={preview.forecast.closeNow} color="#6366f1" hint="Short-term conversion chance" />
              <Meter label="Comes back later" value={preview.forecast.comeBack} color="#f9694a" hint="Long-term return & referral likelihood" />
            </div>
          </div>
        </section>
      </div>

      {/* Live preview */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-coral-300 font-bold text-white">{business.botName[0]}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{business.botName} · {business.brand}</div>
              <div className="text-[11px] text-white/70">Live preview — updates as you drag</div>
            </div>
            <span className="chip bg-white/15 text-[10px] text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
            </span>
          </div>
          <div className="wa-bg min-h-[360px] space-y-2 p-4">
            <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[14px] text-slate-800 shadow-sm">
              {PREVIEW_PROMPT}
              <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                10:42 <CheckCheck size={14} className="text-sky-500" />
              </div>
            </div>
            <AnimatePresence mode="popLayout">
              {preview.bubbles.map((b, i) => (
                <motion.div
                  key={b}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.06 }}
                  className="w-fit max-w-[88%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[14px] leading-snug text-slate-800 shadow-sm"
                >
                  {b}
                  <div className="mt-0.5 text-right text-[10px] text-slate-400">10:42</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="space-y-3 border-t border-slate-100 p-4">
            <div className="flex items-start gap-2 rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-900">
              <Wand2 size={14} className="mt-0.5 shrink-0" />
              <span>
                Try it: drag <b>Sales Style</b> to the right and watch {business.botName} switch from a free gift to a split-pay offer. Then drag <b>Humor</b> up.
              </span>
            </div>
            <button onClick={() => setPage('limbic')} className="btn-indigo w-full">
              Test this personality live <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
