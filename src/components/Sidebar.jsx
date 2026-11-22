import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { NAV } from '../data/nav'
import { useStore } from '../store/AppStore'
import { cn } from '../lib/utils'
import { Icon } from './ui'

export const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-coral-500 shadow-glow">
      <svg viewBox="0 0 64 64" className="h-6 w-6">
        <circle cx="23" cy="27" r="4.5" fill="#fff" />
        <circle cx="41" cy="27" r="4.5" fill="#fff" />
        <path d="M20 38c3.5 5 8 7 12 7s8.5-2 12-7" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
    {!compact && (
      <div className="leading-tight">
        <div className="font-display text-[17px] font-extrabold tracking-tight text-slate-900">Easy Buddy</div>
        <div className="text-[11px] font-medium text-slate-400">AI that sells like a friend</div>
      </div>
    )}
  </div>
)

export default function Sidebar() {
  const { page, setPage, business, isLive, connectedCount, plan, setPricingOpen, trained } = useStore()
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <div className="label mb-1 px-3">Workspace</div>
          {NAV.map((item, i) => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                  active ? 'text-slate-900' : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl border border-slate-200/80 bg-white shadow-soft"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={cn('relative grid h-7 w-7 place-items-center rounded-lg', active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400')}>
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="relative flex-1">{item.label}</span>
                <span className="relative text-[10px] font-semibold text-slate-300">{i + 1}</span>
                {item.id === 'training' && trained && <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-coral-300 font-display text-sm font-bold text-white">
                  {business.botName[0]}
                </div>
                <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white', isLive ? 'bg-emerald-500' : 'bg-slate-300')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{business.botName} · {business.brand}</div>
                <div className="text-xs text-slate-500">
                  {isLive ? `Live on ${connectedCount} channel${connectedCount > 1 ? 's' : ''}` : 'Not live yet'}
                </div>
              </div>
            </div>
            {!plan && (
              <button onClick={() => setPricingOpen(true)} className="btn-indigo mt-3 w-full py-2 text-xs">
                <Zap size={14} /> Go live in 2 minutes
              </button>
            )}
            {plan && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <span>{plan.name} plan</span>
                <span className="chip bg-white px-2 py-0.5 text-[10px] text-emerald-600">ACTIVE</span>
              </div>
            )}
          </div>
          <div className="px-2 text-[11px] text-slate-400">Investor prototype · v1.0</div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/90 px-1 py-1.5 backdrop-blur-xl lg:hidden">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium', page === item.id ? 'text-indigo-600' : 'text-slate-400')}
          >
            <Icon name={item.icon} size={18} />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </>
  )
}
