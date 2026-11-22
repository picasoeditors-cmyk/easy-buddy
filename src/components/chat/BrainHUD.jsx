import { AnimatePresence, motion } from 'framer-motion'
import { Activity, BookHeart, Compass, HeartHandshake, ShieldCheck, Zap, CalendarClock } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { STRATEGIES } from '../../engine/limbic'
import { cn } from '../../lib/utils'

const REGIONS = {
  pfc: { name: 'Prefrontal Cortex', role: 'Sales Strategy Regulator', color: '#6366f1', x: 78, y: 62, icon: Compass },
  accumbens: { name: 'Nucleus Accumbens', role: 'Trust & Delight Index', color: '#10b981', x: 142, y: 98, icon: HeartHandshake },
  amygdala: { name: 'Amygdala', role: 'Emotional Valence & Friction', color: '#f9694a', x: 196, y: 120, icon: Zap },
  hippocampus: { name: 'Hippocampus', role: 'Emotional Memory & Rapport', color: '#f59e0b', x: 246, y: 104, icon: BookHeart },
}

const LINKS = [
  ['amygdala', 'pfc'],
  ['amygdala', 'accumbens'],
  ['hippocampus', 'amygdala'],
  ['hippocampus', 'pfc'],
  ['accumbens', 'pfc'],
]

// A ring that blooms outward every time `k` changes (a neural "firing")
const Pulse = ({ k, color, size = 12 }) => (
  <span className="relative inline-flex" style={{ width: size, height: size }}>
    <span className="absolute inset-0 rounded-full" style={{ background: color }} />
    <AnimatePresence>
      <motion.span
        key={k}
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 3.2, opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </AnimatePresence>
  </span>
)

function NeuralMap({ pulse }) {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full">
      <defs>
        <radialGradient id="brainfill" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Stylised brain silhouette */}
      <path
        d="M58 112c-22-6-30-30-18-50 8-14 22-20 34-20 6-16 26-26 46-22 12-12 36-14 52-4 18-8 42-2 52 14 22 0 40 18 38 40 14 10 14 34-2 44-4 20-26 30-44 24-10 12-32 14-46 6-12 8-30 8-42 0-18 6-38-2-46-16-10-2-20-6-24-16z"
        fill="url(#brainfill)"
        stroke="#c7d2fe"
        strokeWidth="1.5"
      />
      <path d="M96 52c10 10 10 24 0 34M150 40c-6 14-2 26 10 34M206 46c-10 10-8 26 4 34M118 120c12-6 28-6 38 4M206 136c4-10 16-16 28-14" fill="none" stroke="#e0e7ff" strokeWidth="1.5" strokeLinecap="round" />
      {/* Connections */}
      {LINKS.map(([a, b]) => {
        const A = REGIONS[a]
        const B = REGIONS[b]
        return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 4" />
      })}
      {/* Travelling signals on every firing */}
      {LINKS.map(([a, b]) => {
        const A = REGIONS[a]
        const B = REGIONS[b]
        const k = pulse[a]
        if (!k) return null
        return (
          <motion.circle
            key={`${a}${b}${k}`}
            r="3.2"
            fill={A.color}
            filter="url(#glow)"
            initial={{ cx: A.x, cy: A.y, opacity: 1 }}
            animate={{ cx: B.x, cy: B.y, opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        )
      })}
      {/* Nodes */}
      {Object.entries(REGIONS).map(([id, r]) => (
        <g key={id}>
          <motion.circle
            key={`halo-${id}-${pulse[id]}`}
            cx={r.x}
            cy={r.y}
            fill={r.color}
            initial={{ r: 9, opacity: 0.45 }}
            animate={{ r: 24, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <circle cx={r.x} cy={r.y} r="9" fill={r.color} filter="url(#glow)" />
          <circle cx={r.x} cy={r.y} r="3.5" fill="#fff" />
          <text x={r.x} y={r.y + (id === 'pfc' ? -16 : 24)} textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569" fontFamily="Inter">
            {r.name.replace('Nucleus ', 'N. ').replace('Prefrontal Cortex', 'Prefrontal')}
          </text>
        </g>
      ))}
    </svg>
  )
}

const RegionCard = ({ id, pulse, children, className }) => {
  const r = REGIONS[id]
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4', className)}>
      {/* Glow overlay re-mounts on every firing without disturbing the card's content */}
      {pulse > 0 && (
        <motion.div
          key={pulse}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 2px ${r.color}, inset 0 0 28px ${r.color}22` }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
      )}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${r.color}15`, color: r.color }}>
          <r.icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold leading-tight text-slate-800">{r.name}</div>
          <div className="truncate text-[11px] text-slate-500">{r.role}</div>
        </div>
        <Pulse k={pulse} color={r.color} size={9} />
      </div>
      {children}
    </div>
  )
}

const Bar = ({ value, color, centered = false }) => (
  <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
    {centered ? (
      <>
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
        <motion.div
          className="absolute inset-y-0 rounded-full"
          style={{ background: value >= 0 ? '#10b981' : '#f9694a' }}
          animate={{ left: value >= 0 ? '50%' : `${50 + value / 2}%`, width: `${Math.abs(value) / 2}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </>
    ) : (
      <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${value}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
    )}
  </div>
)

const Gauge = ({ value, color }) => {
  const R = 30
  const C = 2 * Math.PI * R
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" className="-rotate-90">
      <circle cx="39" cy="39" r={R} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <motion.circle
        cx="39"
        cy="39"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={C}
        animate={{ strokeDashoffset: C - (C * value) / 100 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      />
    </svg>
  )
}

export default function BrainHUD({ limbic, thinking }) {
  const { amygdala, hippocampus, accumbens, pfc, pulse, history } = limbic
  const strat = STRATEGIES[pfc.strategy]
  const options = ['PITCH', 'LISTEN', 'HUMOR', 'STEP_BACK']

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Activity size={16} className="text-indigo-500" />
          <div>
            <div className="text-sm font-bold text-slate-800">Brain Activity HUD</div>
            <div className="text-[11px] text-slate-500">Limbic Affective State Engine · real time</div>
          </div>
        </div>
        <span className={cn('chip', thinking ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500')}>
          <span className={cn('h-1.5 w-1.5 rounded-full', thinking ? 'animate-pulse bg-indigo-500' : 'bg-slate-400')} />
          {thinking ? 'Processing…' : `Turn ${limbic.turn}`}
        </span>
      </div>

      <AnimatePresence>
        {pfc.mode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'relative flex items-center gap-3 px-5 py-3 text-white',
                pfc.strategy === 'SAFETY' ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-coral-500 via-coral-400 to-amber-400',
              )}
            >
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <ShieldCheck size={20} />
              </motion.div>
              <div className="flex-1">
                <div className="text-sm font-extrabold tracking-tight">{pfc.mode} Mode · ACTIVE</div>
                <div className="text-xs text-white/85">
                  {pfc.strategy === 'SAFETY'
                    ? 'All selling switched off · safety guidance first · human help signposted'
                    : pfc.checkIn
                      ? 'Sale paused · goodwill protected · future check-in logged'
                      : 'No selling · listening first · goodwill protected'}
                </div>
              </div>
              {pfc.checkIn && (
                <span className="chip hidden bg-white/20 text-white sm:inline-flex">
                  <CalendarClock size={12} /> {pfc.checkIn.label}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_1fr]">
        <div className="relative h-44 rounded-2xl bg-slate-50/70 md:h-auto">
          <NeuralMap pulse={pulse} />
        </div>
        <div className="rounded-2xl bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <span className="label">Relationship arc</span>
            <div className="flex gap-2 text-[10px] font-semibold">
              <span className="text-emerald-600">● Trust</span>
              <span className="text-amber-500">● Delight</span>
              <span className="text-coral-500">● Friction</span>
            </div>
          </div>
          <div className="mt-1 h-32">
            <ResponsiveContainer>
              <LineChart data={history} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0' }} labelFormatter={(l) => `Turn ${l}`} />
                <Line type="monotone" dataKey="trust" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={500} />
                <Line type="monotone" dataKey="delight" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive animationDuration={500} />
                <Line type="monotone" dataKey="friction" stroke="#f9694a" strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
        <RegionCard id="amygdala" pulse={pulse.amygdala}>
          <div className="flex items-baseline justify-between">
            <motion.div key={amygdala.signal} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold text-slate-900">
              {amygdala.signal}
            </motion.div>
            <span className="text-[11px] text-slate-400">arousal {amygdala.arousal}</span>
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>Valence</span>
                <span className="font-semibold tabular-nums">{amygdala.valence > 0 ? '+' : ''}{amygdala.valence}</span>
              </div>
              <Bar value={amygdala.valence} centered />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>Sales friction</span>
                <span className="font-semibold tabular-nums">{amygdala.friction}</span>
              </div>
              <Bar value={amygdala.friction} color="#f9694a" />
            </div>
          </div>
          {amygdala.cues.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {amygdala.cues.map((c) => (
                <span key={c} className="chip bg-coral-50 py-0.5 text-[10px] text-coral-600">
                  “{c}”
                </span>
              ))}
            </div>
          )}
        </RegionCard>

        <RegionCard id="hippocampus" pulse={pulse.hippocampus}>
          {hippocampus.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
              Listening for personal context… try “I’m opening a bakery next month”
            </div>
          ) : (
            <ul className="scroll-thin max-h-[132px] space-y-1.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {hippocampus.map((m) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, x: -10, backgroundColor: '#fef3c7' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: '#f8fafc' }}
                    transition={{ duration: 0.9 }}
                    className="rounded-lg px-2.5 py-1.5"
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{m.tag}</div>
                    <div className="text-xs font-medium text-slate-700">{m.text}</div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </RegionCard>

        <RegionCard id="accumbens" pulse={pulse.accumbens}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Gauge value={accumbens.trust} color="#10b981" />
              <div className="absolute inset-0 grid place-items-center">
                <motion.span key={accumbens.trust} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-lg font-extrabold tabular-nums text-slate-900">
                  {accumbens.trust}%
                </motion.span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500">Trust index</div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>Delight & memorability</span>
                  <span className="font-semibold tabular-nums">{accumbens.delight}%</span>
                </div>
                <Bar value={accumbens.delight} color="#f59e0b" />
              </div>
            </div>
          </div>
        </RegionCard>

        <RegionCard id="pfc" pulse={pulse.pfc}>
          <div className="flex flex-wrap gap-1">
            {options.map((o) => {
              const s = STRATEGIES[o]
              const safety = o === 'STEP_BACK' && pfc.strategy === 'SAFETY'
              const active = pfc.strategy === o || (o === 'PITCH' && pfc.strategy === 'CLOSE') || (o === 'LISTEN' && pfc.strategy === 'DISCOVER') || safety
              return (
                <span
                  key={o}
                  className={cn('chip py-0.5 text-[10px] font-bold transition-all', active ? 'text-white' : 'bg-slate-100 text-slate-400')}
                  style={active ? { background: safety ? STRATEGIES.SAFETY.color : s.color } : undefined}
                >
                  {safety ? 'SAFETY' : o === 'PITCH' && pfc.strategy === 'CLOSE' ? 'CLOSE' : o === 'LISTEN' && pfc.strategy === 'DISCOVER' ? 'DISCOVER' : s.label.split(' ')[0].toUpperCase()}
                </span>
              )
            })}
          </div>
          <motion.p key={pfc.rationale} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-xs leading-relaxed text-slate-600">
            <b style={{ color: strat.color }}>{strat.label}:</b> {pfc.rationale}
          </motion.p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            Confidence
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <motion.div className="h-full rounded-full bg-indigo-400" animate={{ width: `${pfc.confidence}%` }} />
            </div>
            <span className="tabular-nums">{pfc.confidence}%</span>
          </div>
        </RegionCard>
      </div>
    </div>
  )
}
