import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Rocket,
  SlidersHorizontal,
  Brain,
  Database,
  Mail,
  Heart,
  Smile,
  Sun,
  Target,
  Coffee,
  Shirt,
  Dumbbell,
  Flower2,
  GraduationCap,
  MessageCircle,
  Globe,
  Instagram,
  Circle,
} from 'lucide-react'
import { useEffect } from 'react'
import { useStore } from '../store/AppStore'
import { cn } from '../lib/utils'

const ICONS = { Rocket, SlidersHorizontal, Brain, Database, Mail, Heart, Smile, Sun, Target, Coffee, Shirt, Dumbbell, Flower2, GraduationCap, MessageCircle, Globe, Instagram }

export const Icon = ({ name, ...props }) => {
  const C = ICONS[name] || Circle
  return <C {...props} />
}

export function Modal({ open, onClose, children, width = 'max-w-2xl', dismissable = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && dismissable && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissable])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => dismissable && onClose?.()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn('relative my-6 w-full overflow-hidden rounded-3xl bg-white shadow-2xl', width)}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {dismissable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toggle({ checked, onChange, color = 'bg-emerald-500', label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300', checked ? color : 'bg-slate-200')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow-md', checked ? 'right-1' : 'left-1')}
      />
    </button>
  )
}

export function Slider({ label, hint, value, onChange, color, left, right, icon }) {
  return (
    <div className="group">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${color}18`, color }}>
            <Icon name={icon} size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-800">{label}</div>
            {hint && <div className="text-xs text-slate-500">{hint}</div>}
          </div>
        </div>
        <motion.div
          key={value}
          initial={{ scale: 1.25, y: -2 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="min-w-[44px] rounded-lg px-2 py-0.5 text-center font-display text-sm font-bold tabular-nums"
          style={{ background: `${color}14`, color }}
        >
          {value}
        </motion.div>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="eb-range"
        style={{ '--c': color, '--v': `${value}%` }}
        aria-label={label}
      />
      {(left || right) && (
        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  const icons = { success: CheckCircle2, warn: AlertTriangle, info: Info }
  const colors = { success: 'text-emerald-500', warn: 'text-amber-500', info: 'text-indigo-500' }
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const I = icons[t.tone] || Info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="glass pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700"
            >
              <I size={18} className={cn('mt-0.5 shrink-0', colors[t.tone])} />
              <span>{t.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function SectionTitle({ eyebrow, title, desc, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="label mb-1">{eyebrow}</div>}
        <h3 className="text-lg font-bold">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'slate', icon }) {
  const tones = {
    slate: 'text-slate-900',
    emerald: 'text-emerald-600',
    indigo: 'text-indigo-600',
    coral: 'text-coral-500',
    amber: 'text-amber-600',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <Icon name={icon} size={16} className="text-slate-300" />}
      </div>
      <div className={cn('mt-2 font-display text-2xl font-extrabold tabular-nums', tones[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

// Deterministic pseudo-QR code (visual only) generated from a seed string
export function FakeQR({ seed = 'easybuddy', size = 168 }) {
  const n = 25
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rand = () => {
    h ^= h << 13
    h >>>= 0
    h ^= h >>> 17
    h ^= h << 5
    h >>>= 0
    return h / 4294967296
  }
  const cells = []
  const finder = (x, y) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!finder(x, y) && rand() > 0.52) cells.push([x, y])
  const s = size / n
  const Finder = ({ x, y }) => (
    <g>
      <rect x={x * s} y={y * s} width={7 * s} height={7 * s} rx={s * 1.6} fill="#0f172a" />
      <rect x={(x + 1) * s} y={(y + 1) * s} width={5 * s} height={5 * s} rx={s * 1.1} fill="#fff" />
      <rect x={(x + 2) * s} y={(y + 2) * s} width={3 * s} height={3 * s} rx={s * 0.7} fill="#0f172a" />
    </g>
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl bg-white">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x * s + 0.4} y={y * s + 0.4} width={s - 0.8} height={s - 0.8} rx={s * 0.3} fill="#0f172a" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={n - 7} y={0} />
      <Finder x={0} y={n - 7} />
      <rect x={size / 2 - s * 2.5} y={size / 2 - s * 2.5} width={s * 5} height={s * 5} rx={s * 1.4} fill="#25D366" stroke="#fff" strokeWidth={s * 0.6} />
    </svg>
  )
}

export function Confetti({ count = 46 }) {
  const colors = ['#6366f1', '#f9694a', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 37) % 100
        const delay = (i % 10) * 0.05
        const rot = (i * 47) % 360
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
            style={{ left: `${x}%`, background: colors[i % colors.length] }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 520 + (i % 7) * 30, opacity: [0, 1, 1, 0], rotate: rot + 360, x: ((i % 5) - 2) * 30 }}
            transition={{ duration: 2.2 + (i % 4) * 0.3, delay, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
