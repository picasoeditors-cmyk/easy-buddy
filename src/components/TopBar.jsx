import { Settings, Sparkles, Cpu, Wifi } from 'lucide-react'
import { NAV } from '../data/nav'
import { useStore } from '../store/AppStore'
import { PROVIDERS } from '../engine/llm'
import { Logo } from './Sidebar'

export default function TopBar() {
  const { page, setWizardOpen, setSettingsOpen, liveLLM, settings } = useStore()
  const meta = NAV.find((n) => n.id === page) || NAV[0]
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-slate-50/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-10">
        <div className="lg:hidden">
          <Logo compact />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold sm:text-xl">{meta.title}</h1>
          <p className="hidden truncate text-sm text-slate-500 sm:block">{meta.subtitle}</p>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          className={`chip hidden border sm:inline-flex ${liveLLM ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          title="Switch AI brain mode"
        >
          {liveLLM ? <Cpu size={13} /> : <Wifi size={13} />}
          {liveLLM ? `Live · ${settings.provider === 'local' ? 'My Claude' : PROVIDERS[settings.provider].label.split(' ')[0]}` : 'Instant Demo Mode'}
          <span className={`h-1.5 w-1.5 rounded-full ${liveLLM ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
        </button>

        <button onClick={() => setWizardOpen(true)} className="btn-primary py-2 text-xs sm:text-sm">
          <Sparkles size={15} />
          <span className="hidden sm:inline">60-sec Quick Setup</span>
          <span className="sm:hidden">Setup</span>
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  )
}
