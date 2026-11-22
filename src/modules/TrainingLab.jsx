import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Database, Upload, Loader2, Check, Sparkles, TrendingUp, TrendingDown, MessageSquareQuote, FileText, Download, Rocket, RotateCcw, Brain } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { useStore } from '../store/AppStore'
import { DEMO_ANALYTICS, PIPELINE } from '../data/demoData'
import { analyzeChats, parseChatFile } from '../engine/analyzer'
import { Stat } from '../components/ui'
import { clamp, cn, sleep } from '../lib/utils'

const GREENS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
const CORALS = ['#e24e30', '#f9694a', '#ff8466', '#ffa58f', '#ffcabd']

function Connector() {
  const { setDataset, toast } = useStore()
  const [state, setState] = useState(null)
  const [count, setCount] = useState(0)
  const fileRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const connectDemo = async () => {
    setState('connecting')
    setCount(0)
    const steps = 24
    for (let i = 1; i <= steps; i++) {
      await sleep(55)
      setCount(Math.round((1240 * i) / steps))
    }
    await sleep(300)
    setDataset(DEMO_ANALYTICS)
    toast('Demo store connected — 1,240 past chats analysed', 'success')
  }

  const handleFile = async (file) => {
    if (!file) return
    setState('parsing')
    try {
      const text = await file.text()
      const chats = parseChatFile(text, file.name)
      if (!chats.length) throw new Error('No conversations found')
      await sleep(900)
      setDataset({ ...analyzeChats(chats), fileName: file.name })
      toast(`Analysed ${chats.length} conversations from ${file.name}`, 'success')
    } catch (e) {
      setState(null)
      toast(`Couldn't read that file: ${e.message}. Try the sample CSV.`, 'warn')
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <motion.button
        whileHover={{ y: -3 }}
        onClick={connectDemo}
        disabled={!!state}
        className="card group relative overflow-hidden p-7 text-left"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-2xl transition group-hover:scale-125" />
        <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          {state === 'connecting' ? <Loader2 className="animate-spin" size={22} /> : <Database size={22} />}
        </span>
        <h3 className="relative mt-4 text-xl font-extrabold">Connect Demo Store Database</h3>
        <p className="relative mt-1 text-sm text-slate-500">1,240 past WhatsApp, Instagram & web chats from a real-feeling small shop.</p>
        <div className="relative mt-5 flex items-center gap-3">
          {state === 'connecting' ? (
            <div className="w-full">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Importing conversations…</span>
                <span className="tabular-nums">{count.toLocaleString()} / 1,240</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${(count / 1240) * 100}%` }} />
              </div>
            </div>
          ) : (
            <span className="btn-emerald">
              <Database size={15} /> Connect (1,240 past chats)
            </span>
          )}
        </div>
      </motion.button>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={cn('card flex flex-col justify-between border-2 border-dashed p-7 transition', drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200')}
      >
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            {state === 'parsing' ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
          </span>
          <h3 className="mt-4 text-xl font-extrabold">Upload your own chat history</h3>
          <p className="mt-1 text-sm text-slate-500">Drop a .csv or .json export from WhatsApp, Instagram, Shopify Inbox or any helpdesk.</p>
          <p className="mt-2 text-xs text-slate-400">CSV columns: chat_id, sender, message, outcome (won / lost)</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={!!state} className="btn-indigo">
            <FileText size={15} /> Choose file
          </button>
          <a href="./sample-chats.csv" download className="btn-ghost text-xs">
            <Download size={14} /> Sample CSV
          </a>
        </div>
      </div>
    </div>
  )
}

const HBar = ({ data, colors }) => (
  <div className="space-y-3">
    {data.map((d, i) => (
      <div key={d.name}>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-slate-700">{d.name}</span>
          <span className="font-bold tabular-nums text-slate-900">{d.value}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors[i % colors.length] }}
            initial={{ width: 0 }}
            animate={{ width: `${clamp(d.value * 2.2)}%` }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
      </div>
    ))}
  </div>
)

function Pipeline({ data, onDone }) {
  const [stage, setStage] = useState(-1)
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const running = stage >= 0 && stage < PIPELINE.length

  const run = async () => {
    setLogs([])
    for (let s = 0; s < PIPELINE.length; s++) {
      setStage(s)
      const lines = PIPELINE[s].logs
      for (let l = 0; l < lines.length; l++) {
        await sleep(420 + Math.random() * 260)
        setLogs((prev) => [...prev, { s, text: lines[l] }])
        setProgress(Math.round(((s + (l + 1) / lines.length) / PIPELINE.length) * 100))
      }
      await sleep(250)
    }
    setStage(PIPELINE.length)
    onDone()
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="label">One click</div>
          <h3 className="text-lg font-bold">Optimize & fine-tune my bot</h3>
          <p className="text-sm text-slate-500">We learn from {data.totalChats.toLocaleString()} conversations and recalibrate your buddy’s emotional strategy.</p>
        </div>
        <button onClick={run} disabled={running || stage === PIPELINE.length} className="btn-indigo shrink-0 px-6 py-3">
          {running ? <Loader2 size={16} className="animate-spin" /> : stage === PIPELINE.length ? <Check size={16} /> : <Sparkles size={16} />}
          {running ? `Fine-tuning… ${progress}%` : stage === PIPELINE.length ? 'Fine-tuned' : 'Optimize & Fine-Tune My Bot'}
        </button>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
        <div className="p-6">
          <div className="relative">
            <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-slate-100" />
            <motion.div className="absolute left-[19px] top-4 w-0.5 bg-gradient-to-b from-indigo-500 to-emerald-500" animate={{ height: `${Math.min(100, progress)}%` }} style={{ maxHeight: 'calc(100% - 2rem)' }} />
            <ul className="relative space-y-5">
              {PIPELINE.map((p, i) => {
                const done = stage > i
                const active = stage === i
                return (
                  <li key={p.key} className="flex items-start gap-4">
                    <motion.span
                      animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={{ duration: 1, repeat: active ? Infinity : 0 }}
                      className={cn(
                        'relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 bg-white transition',
                        done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-indigo-500 text-indigo-600 shadow-glow' : 'border-slate-200 text-slate-300',
                      )}
                    >
                      {done ? <Check size={18} /> : active ? <Loader2 size={17} className="animate-spin" /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </motion.span>
                    <div className="pt-1.5">
                      <div className={cn('text-sm font-bold', done || active ? 'text-slate-900' : 'text-slate-400')}>{p.title}</div>
                      <div className="text-xs text-slate-500">{p.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-950 p-5 font-mono text-[12px] lg:border-l lg:border-t-0">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-coral-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2">easybuddy-tuner</span>
          </div>
          <div className="scroll-thin h-[230px] space-y-1 overflow-y-auto">
            {logs.length === 0 && <div className="text-slate-500">$ waiting for “Optimize & Fine-Tune”…</div>}
            {logs.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={l.text.startsWith('✓') ? 'text-emerald-400' : 'text-slate-300'}>
                <span className="text-indigo-400">[{PIPELINE[l.s].key}]</span> {l.text}
              </motion.div>
            ))}
            {running && <span className="inline-block h-3.5 w-2 animate-pulse bg-slate-300" />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Uplift({ data, trained }) {
  const { setPage } = useStore()
  const series = Array.from({ length: 12 }, (_, i) => {
    const w = i + 1
    const ramp = Math.min(1, i / 5)
    return {
      week: `W${w}`,
      before: +(data.conversion + Math.sin(i * 1.3) * 0.8).toFixed(1),
      after: +(data.conversion + (trained.after - data.conversion) * ramp + Math.sin(i * 1.1) * 0.7).toFixed(1),
    }
  })
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="chip bg-white/20 text-white">
              <Rocket size={12} /> Fine-tuning complete
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-white">Projected uplift for {data.source === 'demo' ? 'your store' : data.fileName}</h3>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPage('limbic')} className="btn bg-white text-emerald-700 hover:bg-emerald-50">
              <Brain size={15} /> Test tuned bot
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Conversion rate', `${data.conversion}%`, `${trained.after}%`, `+${trained.uplift}%`],
            ['Customer return rate', `${data.returnRate}%`, `${trained.returnAfter}%`, `+${trained.returnAfter - data.returnRate} pts`],
            ['Monthly revenue (est.)', `$${trained.revBefore.toLocaleString()}`, `$${trained.revAfter.toLocaleString()}`, `+$${(trained.revAfter - trained.revBefore).toLocaleString()}`],
          ].map(([k, a, b, d]) => (
            <div key={k} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{k}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-sm text-white/60 line-through">{a}</span>
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="font-display text-3xl font-extrabold">
                  {b}
                </motion.span>
              </div>
              <div className="mt-1 text-xs font-bold text-emerald-100">{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="label mb-2">12-week conversion projection</div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gAfter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" name="Before tuning" dataKey="before" stroke="#94a3b8" strokeDasharray="5 4" fill="transparent" strokeWidth={2} />
                <Area type="monotone" name="After tuning" dataKey="after" stroke="#10b981" fill="url(#gAfter)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="label mb-3">What changed in your buddy</div>
          <ul className="space-y-2.5 text-sm">
            {trained.changes.map((c) => (
              <li key={c} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-slate-700">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

export default function TrainingLab() {
  const { dataset, setDataset, trained, setTrained, persona, setPersona, toast } = useStore()

  const finishTuning = () => {
    const data = dataset
    const after = +(data.conversion * 1.52).toFixed(1)
    const returnAfter = Math.round(data.returnRate * 1.55)
    const aov = 64
    const monthlyChats = Math.round(data.totalChats / 3)
    const revBefore = Math.round(monthlyChats * (data.conversion / 100) * aov)
    const revAfter = Math.round(monthlyChats * (after / 100) * aov)
    const tuned = {
      empathy: clamp(persona.empathy + 8),
      warmth: clamp(persona.warmth + 4),
      humor: clamp(Math.max(persona.humor, 45)),
      persistence: clamp(Math.min(persona.persistence, 35)),
    }
    setPersona(tuned)
    setTrained({
      at: Date.now(),
      uplift: Math.round(((after - data.conversion) / data.conversion) * 100),
      after,
      returnAfter,
      revBefore,
      revAfter,
      changes: [
        `Empathy raised to ${tuned.empathy} on price objections`,
        'First price mention delayed until trust > 60%',
        'Hippocampus recall enabled for returning customers',
        `Sales persistence capped at ${tuned.persistence} → fewer “pushy” drop-offs`,
        'Replies held under 2 minutes on all channels',
      ],
    })
    toast('Your buddy has been fine-tuned. Persona updated automatically.', 'success')
  }

  if (!dataset)
    return (
      <div className="space-y-6 pt-4">
        <Connector />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [TrendingUp, 'Why sales closed', 'Emotional triggers, timing & phrases that converted', 'text-emerald-600 bg-emerald-50'],
            [TrendingDown, 'Why sales failed', 'Robotic tone, early price pushes, ignored objections', 'text-coral-500 bg-coral-50'],
            [Sparkles, 'One-click fine-tune', 'Projected conversion & return-rate uplift', 'text-indigo-600 bg-indigo-50'],
          ].map(([I, t, d, c]) => (
            <div key={t} className="card p-5">
              <span className={cn('grid h-10 w-10 place-items-center rounded-xl', c)}>
                <I size={18} />
              </span>
              <div className="mt-3 font-bold">{t}</div>
              <div className="text-sm text-slate-500">{d}</div>
            </div>
          ))}
        </div>
      </div>
    )

  const d = dataset
  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="chip bg-emerald-50 text-emerald-700">
          <Database size={12} /> {d.source === 'demo' ? 'Demo Store Database' : d.fileName} · {d.totalChats.toLocaleString()} conversations
        </span>
        <button
          onClick={() => {
            setDataset(null)
            setTrained(null)
          }}
          className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-600"
        >
          <RotateCcw size={13} /> Change data source
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Conversations" value={d.totalChats.toLocaleString()} sub={`${d.won.toLocaleString()} won · ${d.lost.toLocaleString()} lost`} icon="MessageCircle" />
        <Stat label="Conversion" value={`${d.conversion}%`} sub="Chat → purchase" tone="indigo" icon="Target" />
        <Stat label="Avg first reply" value={`${d.avgResponse}s`} sub="Across all channels" tone="amber" icon="Globe" />
        <Stat label="Return customers" value={`${d.returnRate}%`} sub="Came back within 90 days" tone="emerald" icon="Heart" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <h3 className="font-bold">Why sales closed</h3>
            <span className="ml-auto text-xs text-slate-400">share of won chats</span>
          </div>
          <HBar data={d.closed} colors={GREENS} />
          <div className="mt-6">
            <div className="label mb-2">Conversion by first-reply time</div>
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={d.timing} margin={{ left: -24, right: 4 }}>
                  <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="rate" name="Conversion" radius={[6, 6, 0, 0]}>
                    {d.timing.map((_, i) => (
                      <Cell key={i} fill={GREENS[Math.min(i, GREENS.length - 1)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-coral-500" />
            <h3 className="font-bold">Why sales failed</h3>
            <span className="ml-auto text-xs text-slate-400">share of lost chats</span>
          </div>
          <HBar data={d.failed} colors={CORALS} />
          <div className="mt-6">
            <div className="label mb-2">Where customers drop off</div>
            <div className="h-36">
              <ResponsiveContainer>
                <AreaChart data={d.dropoff} margin={{ left: -24, right: 4 }}>
                  <defs>
                    <linearGradient id="gDrop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f9694a" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f9694a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="customers" name="Customers remaining" stroke="#f9694a" fill="url(#gDrop)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquareQuote size={18} className="text-indigo-500" />
          <h3 className="font-bold">Phrases that converted</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {d.phrases.map((p, i) => (
            <motion.div key={p.text} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-medium leading-snug text-slate-700">{p.text}</div>
              <div className="mt-2 text-xs font-bold text-emerald-600">+{p.lift}% close rate</div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">{trained ? <Uplift key="up" data={d} trained={trained} /> : <Pipeline key="pipe" data={d} onDone={finishTuning} />}</AnimatePresence>
    </div>
  )
}
